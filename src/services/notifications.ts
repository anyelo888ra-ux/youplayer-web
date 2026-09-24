import { dbService } from './db';
import { TaskReminder } from '../types';

export class NotificationService {
  private checkInterval: number | null = null;
  private audioCtx: AudioContext | null = null;
  private onReminderTriggeredCallback: ((reminder: TaskReminder) => void) | null = null;

  init(onTrigger?: (reminder: TaskReminder) => void): void {
    if (onTrigger) {
      this.onReminderTriggeredCallback = onTrigger;
    }

    // Check reminders every 20 seconds
    if (!this.checkInterval && typeof window !== 'undefined') {
      this.checkInterval = window.setInterval(() => {
        this.checkDueReminders();
      }, 20000);
      // Run once immediately
      this.checkDueReminders();
    }
  }

  // Request browser permission
  async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch {
      return 'denied';
    }
  }

  isPermissionGranted(): boolean {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    return Notification.permission === 'granted';
  }

  // Synthesize soft chime sound with Web Audio API
  playNotificationChime(): void {
    try {
      if (typeof window === 'undefined') return;
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.audioCtx) {
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;

      // Note 1 (E5 - 659.25Hz)
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.6);

      // Note 2 (G5 - 783.99Hz)
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(783.99, now + 0.15);
      gain2.gain.setValueAtTime(0.25, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.9);
    } catch {
      // Audio autoplay policy or unavailable audio context
    }
  }

  // Check due reminders in IndexedDB
  async checkDueReminders(): Promise<void> {
    try {
      const reminders = await dbService.getReminders();
      const now = Date.now();

      for (const reminder of reminders) {
        if (!reminder.completed && !reminder.notified && reminder.scheduledTime <= now) {
          // Trigger notification
          this.triggerNotification(reminder);
          // Mark as notified in db
          reminder.notified = true;
          await dbService.saveReminder(reminder);
        }
      }
    } catch (e) {
      console.warn('Failed to check reminders:', e);
    }
  }

  // Trigger both native notification and callback
  triggerNotification(reminder: TaskReminder): void {
    this.playNotificationChime();

    if (this.onReminderTriggeredCallback) {
      this.onReminderTriggeredCallback(reminder);
    }

    if (this.isPermissionGranted()) {
      try {
        new Notification(`Reminder: ${reminder.label || 'Watch Video'}`, {
          body: `"${reminder.videoTitle}" is waiting on your watchlist!`,
          icon: '/pwa-192x192.png',
          badge: '/icon.svg',
          silent: false
        });
      } catch (err) {
        console.warn('Notification constructor error:', err);
      }
    }
  }

  destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

export const notificationService = new NotificationService();
