import { Injectable, signal } from '@angular/core';
import Pusher from 'pusher-js';
import { Subject } from 'rxjs';@Injectable({ providedIn: 'root' })
export class PusherService {
  private pusher: Pusher;
  private channel: any;
  public onEvent = new Subject<{type: string, data: any}>();
  public myPlayerNumber = signal<1 | 2 | null>(null);
  public playersCount = signal(0);

  constructor() {
    const urlParams = new URLSearchParams(window.location.search);
    let roomId = urlParams.get('room');
    if (!roomId) {
      roomId = Math.random().toString(36).substring(7);
      window.history.replaceState({}, '', `?room=${roomId}`);
    }

    this.pusher = new (Pusher as any)('69bc9629d7ee161329fd', {
      cluster: 'eu',
      authEndpoint: window.location.origin + '/api/auth',
      auth: {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    });

    this.channel.bind('pusher:member_added', (member: any) => {
      this.playersCount.set(this.channel.members.count);
    });

    this.channel.bind('pusher:member_removed', (member: any) => {
      this.playersCount.set(this.channel.members.count);
    });

    this.channel.bind('client-sync-state', (data: any) => {
      this.onEvent.next({ type: 'sync-state', data });
    });

    this.channel.bind('client-request-state', () => {
      this.onEvent.next({ type: 'request-state', data: null });
    });
  }

  sendAction(type: string, data: any) {
    this.channel.trigger(`client-${type}`, data);
  }}
