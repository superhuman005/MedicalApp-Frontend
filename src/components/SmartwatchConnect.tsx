import { useCallback, useEffect, useRef, useState } from "react";
import { Card, SectionTitle, RefButton, RefBadge, Sparkline } from "@/components/ui-ref";
import { Icon } from "@/components/Icon";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/services/api";
import {
  connectWearableDevice,
  disconnectWearableDevice,
  getWearableDevice,
  syncWearableReadings,
} from "@/services/wearables";
import {
  connectHeartRateMonitor,
  isWebBluetoothSupported,
  type HeartRateSession,
} from "@/lib/bluetoothHeartRate";
import type { WearableDevice } from "@/types";

// How often buffered live readings get flushed to the backend. A chest
// strap/watch can report once a second or faster - saving every single beat
// as its own database row would be overkill, so readings are buffered here
// and sent as one small batch on this interval instead.
const SYNC_INTERVAL_MS = 30_000;
const MAX_TREND_POINTS = 30;

const timeAgo = (iso?: string) => {
  if (!iso) return null;
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString();
};

// Lets a patient connect a smartwatch or heart-rate monitor straight from
// their browser over Bluetooth and have readings sync into their vitals
// automatically. See src/lib/bluetoothHeartRate.ts for what this can and
// can't reach (standard BLE Heart Rate devices only - not Apple Health,
// Fitbit's or Google's own cloud APIs, which need a native app).
const SmartwatchConnect = () => {
  const { toast } = useToast();
  const supported = isWebBluetoothSupported();

  const [device, setDevice] = useState<WearableDevice | null>(null);
  const [isLoadingDevice, setIsLoadingDevice] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [liveBpm, setLiveBpm] = useState<number | null>(null);
  const [trend, setTrend] = useState<number[]>([]);

  const sessionRef = useRef<HeartRateSession | null>(null);
  const pendingReadingsRef = useRef<{ heartRate: number; recordedAt: string }[]>([]);
  const syncTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    getWearableDevice()
      .then(setDevice)
      .catch(() => setDevice(null))
      .finally(() => setIsLoadingDevice(false));
  }, []);

  const stopLiveSession = useCallback(() => {
    sessionRef.current?.disconnect();
    sessionRef.current = null;
    if (syncTimerRef.current) {
      clearInterval(syncTimerRef.current);
      syncTimerRef.current = null;
    }
    setIsLive(false);
  }, []);

  // Clean up the Bluetooth connection and sync timer if the patient
  // navigates away from this tab while still connected.
  useEffect(() => () => stopLiveSession(), [stopLiveSession]);

  const flushPendingReadings = useCallback(async () => {
    if (pendingReadingsRef.current.length === 0) return;
    const batch = pendingReadingsRef.current;
    pendingReadingsRef.current = [];
    try {
      const updated = await syncWearableReadings(batch);
      setDevice(updated);
    } catch (error) {
      // Best-effort - readings stay buffered for the next tick on most
      // failures, but a batch this large arriving late isn't worth blocking
      // on, so just drop it and let fresher readings carry on.
      console.error("Wearable sync failed:", getErrorMessage(error));
    }
  }, []);

  const handleReading = useCallback((bpm: number) => {
    setLiveBpm(bpm);
    setTrend((prev) => [...prev, bpm].slice(-MAX_TREND_POINTS));
    pendingReadingsRef.current.push({ heartRate: bpm, recordedAt: new Date().toISOString() });
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const session = await connectHeartRateMonitor(handleReading, () => {
        stopLiveSession();
        toast({ title: "Device disconnected", description: "Your smartwatch lost its Bluetooth connection." });
      });
      sessionRef.current = session;

      const saved = await connectWearableDevice(session.deviceName);
      setDevice(saved);
      setIsLive(true);
      setTrend([]);
      syncTimerRef.current = setInterval(flushPendingReadings, SYNC_INTERVAL_MS);

      toast({ title: "Device connected", description: `Now syncing live heart rate from ${session.deviceName}.` });
    } catch (error) {
      // The person cancelling the browser's device picker lands here too -
      // that's not worth an error toast.
      const message = getErrorMessage(error);
      if (!/cancelled|user gesture/i.test(message)) {
        toast({ title: "Couldn't connect device", description: message, variant: "destructive" });
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await flushPendingReadings();
    stopLiveSession();
    setLiveBpm(null);
    setTrend([]);
    try {
      await disconnectWearableDevice();
      setDevice(null);
      toast({ title: "Device disconnected" });
    } catch (error) {
      toast({ title: "Couldn't disconnect device", description: getErrorMessage(error), variant: "destructive" });
    }
  };

  return (
    <Card>
      <SectionTitle
        title="Smartwatch & Heart Rate"
        sub="Connect a Bluetooth heart-rate monitor or smartwatch to sync readings automatically"
      />

      {!supported ? (
        <div className="flex items-start gap-3 rounded-xl border border-[var(--c-line)] bg-[var(--c-surface2)] p-4">
          <Icon name="info" className="h-4 w-4 mt-0.5 shrink-0 text-[var(--c-muted)]" />
          <p className="text-[13px] text-[var(--c-muted)]">
            Your browser can't connect to Bluetooth devices directly. Try this on Chrome or Edge, on desktop or
            Android (Safari and Firefox don't support it). You can still log vitals by hand from the Records page.
          </p>
        </div>
      ) : isLoadingDevice ? (
        <div className="flex items-center gap-2 text-[13px] text-[var(--c-muted)] py-6">
          <Icon name="refresh" className="h-4 w-4 animate-spin" /> Checking for a connected device…
        </div>
      ) : !device ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-[13px] text-[var(--c-muted)]">
            No device connected yet. This pairs with any watch, band or chest strap that broadcasts the standard
            Bluetooth heart-rate profile - your browser will show a picker of nearby devices to choose from.
          </p>
          <RefButton onClick={handleConnect} disabled={isConnecting}>
            {isConnecting ? (
              <Icon name="refresh" className="h-4 w-4 animate-spin" />
            ) : (
              <Icon name="activity" className="h-4 w-4" />
            )}
            {isConnecting ? "Connecting…" : "Connect Smartwatch"}
          </RefButton>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--c-accentsoft)]">
                <Icon name="activity" className="h-5 w-5 text-[var(--c-brand)]" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-[var(--c-ink)]">{device.deviceName}</p>
                <RefBadge dot={isLive ? "#4ade80" : "#9ca3af"} className="mt-0.5">
                  {isLive ? "Live" : "Connected"}
                </RefBadge>
              </div>
            </div>
            <RefButton variant="outline" onClick={handleDisconnect}>
              <Icon name="x" className="h-4 w-4" /> Disconnect
            </RefButton>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="rounded-xl border border-[var(--c-line)] bg-[var(--c-surface)] p-4">
              <p className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--c-muted)]">
                <Icon name="heart" className={`h-3.5 w-3.5 text-red-500 ${isLive ? "animate-pulse" : ""}`} />
                Heart Rate
              </p>
              <p className="mt-1 text-[28px] leading-none font-extrabold tracking-tight text-[var(--c-ink)]">
                {liveBpm ?? device.lastHeartRate ?? "—"}
                <span className="ml-1 text-[13px] font-medium text-[var(--c-muted)]">bpm</span>
              </p>
              <p className="mt-2 text-[11.5px] text-[var(--c-muted)]">
                {isLive ? "Streaming now" : `Last synced ${timeAgo(device.lastSyncAt) || "never"}`}
              </p>
            </div>

            <div className="rounded-xl border border-[var(--c-line)] bg-[var(--c-surface)] p-4 flex flex-col justify-between">
              <p className="text-[12px] font-semibold text-[var(--c-muted)]">This session's trend</p>
              {trend.length > 1 ? (
                <Sparkline data={trend} color="#ef4444" />
              ) : (
                <p className="text-[12px] text-[var(--c-muted)] mt-2">Readings will chart here once they start coming in.</p>
              )}
            </div>
          </div>

          {!isLive && (
            <p className="text-[12px] text-[var(--c-muted)]">
              Live monitoring stops when you leave this page - come back and connect again any time to resume
              streaming.{" "}
              <button type="button" onClick={handleConnect} className="text-[var(--c-brand)] hover:underline">
                Resume now
              </button>
            </p>
          )}
        </div>
      )}
    </Card>
  );
};

export default SmartwatchConnect;
