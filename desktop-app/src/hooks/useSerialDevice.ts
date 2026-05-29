import { useCallback, useEffect, useRef, useState } from 'react';
import type { SerialLine } from '../types';

interface UseSerialDeviceOptions {
  onLine(line: string): void;
  onLog(line: SerialLine): void;
}

export function useSerialDevice({ onLine, onLog }: UseSerialDeviceOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [isSupported] = useState(() => Boolean(navigator.serial));
  const portRef = useRef<SerialPort | null>(null);
  const writerRef = useRef<WritableStreamDefaultWriter<Uint8Array> | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const bufferRef = useRef('');

  const log = useCallback(
    (direction: SerialLine['direction'], message: string) => {
      onLog({ direction, message, at: Date.now() });
    },
    [onLog]
  );

  const disconnect = useCallback(async () => {
    const hadDevice = Boolean(portRef.current || writerRef.current || readerRef.current);

    try {
      await readerRef.current?.cancel();
    } catch {
      // Ignore cancellation races during device unplug.
    }

    try {
      writerRef.current?.releaseLock();
    } catch {
      // Ignore writer cleanup races.
    }

    try {
      await portRef.current?.close();
    } catch {
      // Ports can already be closed after unplug.
    }

    readerRef.current = null;
    writerRef.current = null;
    portRef.current = null;
    bufferRef.current = '';
    setIsConnected(false);
    if (hadDevice) {
      log('system', 'hardware disconnected');
    }
  }, [log]);

  const readLoop = useCallback(
    async (port: SerialPort) => {
      if (!port.readable) return;

      const decoder = new TextDecoder();
      const reader = port.readable.getReader();
      readerRef.current = reader;

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (!value) continue;

          bufferRef.current += decoder.decode(value, { stream: true });
          const lines = bufferRef.current.split(/\r?\n/);
          bufferRef.current = lines.pop() ?? '';

          for (const raw of lines) {
            const line = raw.trim();
            if (!line) continue;
            log('in', line);
            onLine(line);
          }
        }
      } catch {
        log('system', 'serial read loop stopped');
      } finally {
        reader.releaseLock();
        readerRef.current = null;
      }
    },
    [log, onLine]
  );

  const connect = useCallback(async () => {
    if (!navigator.serial) {
      log('system', 'Web Serial is not supported in this browser');
      return;
    }

    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: 115200 });

    if (!port.writable) {
      throw new Error('Selected serial port is not writable');
    }

    portRef.current = port;
    writerRef.current = port.writable.getWriter();
    setIsConnected(true);
    log('system', 'hardware connected at 115200 baud');
    void readLoop(port);
  }, [log, readLoop]);

  const send = useCallback(
    async (message: string) => {
      const writer = writerRef.current;
      if (!writer) return;

      const line = message.endsWith('\n') ? message : `${message}\n`;
      await writer.write(new TextEncoder().encode(line));
      log('out', message.trim());
    },
    [log]
  );

  useEffect(() => () => void disconnect(), [disconnect]);

  return {
    connect,
    disconnect,
    send,
    isConnected,
    isSupported
  };
}
