import { Injectable, signal } from '@angular/core';
import Pusher from 'pusher-js';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PusherService {
  private pusher: any;
  private channel: any;
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

    try {
      this.pusher = new Pusher('69bc9629d7ee161329fd', {
        cluster: 'eu',
        authEndpoint: '/api/auth',
      });

      const channelName = `presence-triviador-${roomId}`;
      this.channel = this.pusher.subscribe(channelName);
      this.bindEvents();
    } catch (e) {
      console.error('Pusher init error:', e);
    }
  }

  private bindEvents() {
    if (!this.channel) return;

    this.channel.bind('pusher:subscription_succeeded', (members: any) => {
      this.playersCount.set(members.count);
      if (!this.myPlayerNumber()) {
        this.myPlayerNumber.set(members.count === 1 ? 1 : 2);
      }
    });

    this.channel.bind('pusher:member_added', () => {
      if (this.channel.members) this.playersCount.set(this.channel.members.count);
    });

    this.channel.bind('pusher:member_removed', () => {
      if (this.channel.members) this.playersCount.set(this.channel.members.count);
    });

    this.channel.bind('client-sync-state', (data: any) => {
      this.onEvent.next({ type: 'sync-state', data });
    });

    this.channel.bind('client-request-state', () => {
      this.onEvent.next({ type: 'request-state', data: null });
    });
  }

  sendAction(type: string, data: any) {
    if (!this.channel || !this.channel.subscribed) {
      console.warn(`sendAction("${type}") skipped: channel not initialized or not subscribed`);
      return;
    }
    this.channel.trigger(`client-${type}`, data);
  }
}