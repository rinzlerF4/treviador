import { Injectable, signal } from '@angular/core';
import Pusher from 'pusher-js';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PusherService {
  private pusher: any;
  private channel: any;
  private roomId: string;
  public onEvent = new Subject<{ type: string; data: any }>();
  public myPlayerNumber = signal<1 | 2 | null>(null);
  public playersCount = signal(0);

  constructor() {
    const urlParams = new URLSearchParams(window.location.search);
    let roomId = urlParams.get('room');
    if (!roomId) {
      roomId = Math.random().toString(36).substring(7);
      window.history.replaceState({}, '', `?room=${roomId}`);
    }
    this.roomId = roomId;

    try {
      this.pusher = new Pusher('69bc9629d7ee161329fd', {
        cluster: 'eu',
      });

      this.channel = this.pusher.subscribe(`triviador-public-${roomId}`);
      this.bindEvents();
    } catch (e) {
      console.error('Pusher init error:', e);
    }
  }

  private bindEvents() {
    if (!this.channel) return;

    this.channel.bind('sync-state', (data: any) => {
      this.onEvent.next({ type: 'sync-state', data });
    });

    this.channel.bind('request-state', () => {
      this.onEvent.next({ type: 'request-state', data: null });
    });
  }

  // Публичные каналы не поддерживают client.trigger —
  // отправляем событие на бэкенд, а он публикует его через серверный Pusher SDK
  async sendAction(type: string, data: any) {
    try {
      await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: `triviador-public-${this.roomId}`,
          event: type,
          data,
        }),
      });
    } catch (e) {
      console.error(`sendAction("${type}") failed:`, e);
    }
  }
}