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
      cluster: 'eu'
    });

    this.channel = this.pusher.subscribe(`triviador-game-${roomId}`);

    this.channel.bind('client-game-event', (data: any) => {
      this.onEvent.next(data);
    });
  }

  sendAction(type: string, data: any) {
    this.channel.trigger('client-game-event', { type, data });
  }
}
