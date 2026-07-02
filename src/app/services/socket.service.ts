import { Injectable } from '@angular/core';
import Pusher from 'pusher-js';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PusherService {
  private pusher: Pusher;
  private channel: any;
  public onEvent = new Subject<{type: string, data: any}>();

  constructor() {
    const urlParams = new URLSearchParams(window.location.search);
    let roomId = urlParams.get('room');
    if (!roomId) {
      roomId = Math.random().toString(36).substring(7);
      window.history.replaceState({}, '', `?room=${roomId}`);
    }

    this.pusher = new Pusher('69bc9629d7ee161329fd', {
      cluster: 'eu',
      authEndpoint: '/api/auth' // Путь к нашей функции авторизации
    });

    this.channel = this.pusher.subscribe(`private-triviador-${roomId}`);

    this.channel.bind('client-sync-state', (data: any) => {
      this.onEvent.next({ type: 'sync-state', data });
    });
  }

  sendAction(type: string, data: any) {
    // В приватных каналах события ДОЛЖНЫ начинаться с client-
    this.channel.trigger('client-sync-state', data);
  }
}
