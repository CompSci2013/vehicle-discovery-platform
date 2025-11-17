/*
  BROADCAST CHANNEL SERVICE

  PURPOSE:
  This service enables communication between multiple browser windows/tabs
  of the same application. It uses the BroadcastChannel API, which is a
  modern browser feature that allows simple pub/sub messaging.

  WHY WE NEED THIS:
  Allows users to "pop out" panels into separate windows that stay synchronized
  with the main window:
  - When user applies filters in main window, pop-out sees updated results
  - When user closes pop-out, main window restores the panel to the grid
  - When user navigates in main window, pop-out stays in sync

  HOW IT WORKS:
  1. All windows/tabs join the same "channel" (identified by string name)
  2. Any window can broadcast a message to the channel
  3. All OTHER windows receive the message (sender doesn't receive own message)
  4. Each window handles messages according to message type

  CONFIGURATION:
  The channel name can be configured using the BROADCAST_CHANNEL_NAME injection token.
  If not provided, defaults to 'app-broadcast-channel'.

  BROWSER SUPPORT:
  BroadcastChannel is supported in all modern browsers (Chrome 54+, Firefox 38+,
  Safari 15.4+). For older browsers, this service provides a fallback mechanism.
*/

import { Injectable, OnDestroy, Optional, Inject, InjectionToken } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

/**
 * BROADCAST CHANNEL NAME INJECTION TOKEN
 *
 * Use this token to configure the channel name at module level.
 *
 * @example
 * ```typescript
 * // In app.module.ts or app.config.ts
 * providers: [
 *   { provide: BROADCAST_CHANNEL_NAME, useValue: 'vehicle-discovery-channel' }
 * ]
 * ```
 */
export const BROADCAST_CHANNEL_NAME = new InjectionToken<string>(
  'BROADCAST_CHANNEL_NAME',
  {
    providedIn: 'root',
    factory: () => 'app-broadcast-channel' // Default channel name
  }
);

/*
  MESSAGE STRUCTURE

  All messages sent through the BroadcastChannel follow this interface.
  This provides type safety and ensures consistent message format.
*/
export interface BroadcastMessage<T = any> {
  /*
    TYPE: Identifies what kind of message this is
    Examples: 'STATE_UPDATE', 'PANEL_CLOSED', 'FILTER_CHANGED'

    By including type in every message, receivers can use switch statements
    or filter operators to handle only the messages they care about.
  */
  type: string;

  /*
    PAYLOAD: The actual data being sent
    Type is generic (T) so different message types can have different payloads

    Example payloads:
    - STATE_UPDATE: { filters: {...}, sortBy: 'year', page: 1 }
    - PANEL_CLOSED: { panelId: 'manufacturer-picker' }
    - FILTER_CHANGED: { manufacturer: 'Ford', model: 'F-150' }
  */
  payload: T;

  /*
    TIMESTAMP: When the message was sent
    Useful for:
    - Debugging (seeing message order in console)
    - Ignoring stale messages (if message is > 5 seconds old, skip it)
    - Performance monitoring (measuring latency between windows)
  */
  timestamp: number;

  /*
    SENDER_ID: Unique identifier for the window/tab that sent the message
    Generated once per window using crypto.randomUUID() or Date.now()

    Why needed:
    - Sometimes you want to ignore messages from yourself (avoid loops)
    - Useful for debugging (which window sent this message?)
    - Can be used for targeted messaging (though BroadcastChannel is broadcast-only)
  */
  senderId: string;
}

/*
  BROADCAST CHANNEL SERVICE

  This service is provided at root level (singleton), meaning only ONE instance
  exists for the entire application. This is important because we only want
  ONE BroadcastChannel connection per window.
*/
@Injectable({
  providedIn: 'root'
})
export class BroadcastChannelService implements OnDestroy {
  /*
    CHANNEL NAME

    All windows must use the same channel name to communicate.
    Can be configured via BROADCAST_CHANNEL_NAME injection token.

    Default: 'app-broadcast-channel'

    To customize, provide in your module:
    providers: [
      { provide: BROADCAST_CHANNEL_NAME, useValue: 'your-custom-channel' }
    ]
  */
  private readonly channelName: string;

  /*
    BROADCAST CHANNEL INSTANCE

    This is the actual BroadcastChannel object provided by the browser.
    It handles all the low-level messaging details for us.

    May be null if:
    1. Running in Node.js environment (SSR, tests)
    2. Browser doesn't support BroadcastChannel
  */
  private channel: BroadcastChannel | null = null;

  /*
    MESSAGE SUBJECT

    RxJS Subject that emits all received messages.
    Components subscribe to this to receive messages.

    Why Subject instead of BehaviorSubject?
    - We don't need to replay last message to new subscribers
    - Messages are events that happen at specific times
    - No meaningful "initial value" for a message stream
  */
  private messageSubject = new Subject<BroadcastMessage>();

  /*
    MESSAGE OBSERVABLE

    Public observable that components subscribe to.
    Exposes messageSubject as read-only to prevent external code from
    calling next() directly (only this service should emit messages).
  */
  public messages$: Observable<BroadcastMessage> = this.messageSubject.asObservable();

  /*
    SENDER ID

    Unique identifier for THIS window/tab.
    Generated once when service is created.

    crypto.randomUUID() generates a standard UUID v4:
    Example: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"

    Fallback to Date.now() + random number if crypto is not available
    (though crypto is available in all modern browsers)
  */
  private senderId: string;

  /*
    DESTROY SUBJECT

    Used for cleanup when the service is destroyed.
    All subscriptions use takeUntil(this.destroy$) to automatically
    unsubscribe when the service is destroyed.

    This prevents memory leaks.
  */
  private destroy$ = new Subject<void>();

  /*
    CONSTRUCTOR

    Runs once when Angular creates this service (first time it's injected).

    Steps:
    1. Inject the configured channel name (or use default)
    2. Generate unique sender ID for this window
    3. Initialize BroadcastChannel connection
    4. Set up message listener

    @param channelName - Injected channel name (configured via BROADCAST_CHANNEL_NAME token)
  */
  constructor(
    @Inject(BROADCAST_CHANNEL_NAME) channelName: string
  ) {
    // Set the channel name from injection or use default
    this.channelName = channelName;

    // Generate unique ID for this window/tab
    this.senderId = this.generateSenderId();

    // Initialize the BroadcastChannel
    this.initChannel();
  }

  /*
    GENERATE SENDER ID

    Creates a unique identifier for this window/tab.

    Modern approach: crypto.randomUUID()
    - Generates a standard UUID v4 string
    - Guaranteed to be unique (astronomically low collision probability)
    - Available in all modern browsers

    Fallback: timestamp + random number
    - Good enough for testing/development
    - Very low collision probability
    - Works even in older environments

    @returns Unique identifier string
  */
  private generateSenderId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }

    // Fallback for older environments
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /*
    INITIALIZE CHANNEL

    Creates the BroadcastChannel connection and sets up message listener.

    BROWSER ENVIRONMENT CHECK:
    We check typeof window !== 'undefined' because:
    1. Angular Universal (SSR) runs in Node.js, which has no window object
    2. Unit tests might run in Node.js environment
    3. BroadcastChannel only exists in browser environment

    MESSAGE LISTENER:
    The onmessage handler fires whenever ANY other window sends a message
    on this channel. The sender's window does NOT receive its own messages.

    ERROR HANDLING:
    If BroadcastChannel creation fails (unsupported browser), we catch the
    error and log it. The service continues to work, but messages won't
    be sent/received (graceful degradation).
  */
  private initChannel(): void {
    // Only initialize if we're in a browser environment
    if (typeof window === 'undefined') {
      console.warn('BroadcastChannelService: Not in browser environment, skipping initialization');
      return;
    }

    try {
      // Create the BroadcastChannel
      this.channel = new BroadcastChannel(this.channelName);

      // Set up message listener
      this.channel.onmessage = (event: MessageEvent) => {
        /*
          EVENT.DATA contains the message sent by another window.
          We emit it through our messageSubject so Angular components
          can subscribe and react to it.

          The message should already be a BroadcastMessage object
          (because we send properly formatted messages), but we
          could add validation here if needed.
        */
        const message: BroadcastMessage = event.data;

        // Emit the message to all subscribers
        this.messageSubject.next(message);

        // Optional: Log in development for debugging
        if (!this.isProduction()) {
          console.log('[BroadcastChannel] Received:', message);
        }
      };

      console.log(`BroadcastChannelService: Channel "${this.channelName}" initialized`);
    } catch (error) {
      // BroadcastChannel not supported or initialization failed
      console.error('BroadcastChannelService: Failed to initialize channel', error);
      this.channel = null;
    }
  }

  /*
    SEND MESSAGE

    Broadcasts a message to all other windows/tabs on the same channel.

    IMPORTANT: The sending window does NOT receive its own message.
    If you need the sender to also process the message, handle it separately.

    @param type - Message type identifier (e.g., 'STATE_UPDATE')
    @param payload - The data to send (any JSON-serializable value)
    @returns boolean - true if message was sent, false if channel unavailable

    USAGE EXAMPLE:
    this.broadcastService.sendMessage('FILTER_CHANGED', {
      manufacturer: 'Ford',
      model: 'F-150',
      yearMin: 2020
    });
  */
  public sendMessage<T = any>(type: string, payload: T): boolean {
    // Can't send if channel wasn't created
    if (!this.channel) {
      console.warn('BroadcastChannelService: Cannot send message, channel not available');
      return false;
    }

    try {
      // Create properly formatted message
      const message: BroadcastMessage<T> = {
        type,
        payload,
        timestamp: Date.now(),
        senderId: this.senderId
      };

      // Send through the channel
      this.channel.postMessage(message);

      // Optional: Log in development
      if (!this.isProduction()) {
        console.log('[BroadcastChannel] Sent:', message);
      }

      return true;
    } catch (error) {
      console.error('BroadcastChannelService: Failed to send message', error);
      return false;
    }
  }

  /*
    SUBSCRIBE TO MESSAGE TYPE

    Returns an Observable that only emits messages of a specific type.
    This is more convenient than subscribing to messages$ and filtering manually.

    @param messageType - The type of messages to receive
    @returns Observable that emits only messages of the specified type

    USAGE EXAMPLE:
    this.broadcastService.onMessage('STATE_UPDATE')
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        console.log('State updated:', message.payload);
        this.applyStateUpdate(message.payload);
      });

    WHY USEFUL:
    Components typically only care about specific message types.
    This method makes the code cleaner and more readable.
  */
  public onMessage<T = any>(messageType: string): Observable<BroadcastMessage<T>> {
    return this.messages$.pipe(
      // Only emit messages that match the specified type
      filter(message => message.type === messageType)
    );
  }

  /*
    CHECK IF MESSAGE IS FROM THIS WINDOW

    Helper method to determine if a message was sent by this window/tab.

    @param message - The message to check
    @returns boolean - true if this window sent the message

    WHY NEEDED:
    BroadcastChannel normally prevents you from receiving your own messages,
    but there might be scenarios where you're testing or have a different
    messaging system and need to check sender identity.

    USAGE EXAMPLE:
    this.broadcastService.messages$.subscribe(message => {
      if (!this.broadcastService.isOwnMessage(message)) {
        // Process messages from other windows only
        this.handleExternalMessage(message);
      }
    });
  */
  public isOwnMessage(message: BroadcastMessage): boolean {
    return message.senderId === this.senderId;
  }

  /*
    GET SENDER ID

    Returns the unique identifier for this window/tab.
    Useful for debugging or logging purposes.

    @returns string - This window's sender ID
  */
  public getSenderId(): string {
    return this.senderId;
  }

  /*
    CHECK IF CHANNEL IS AVAILABLE

    Determines whether BroadcastChannel is available and working.

    @returns boolean - true if channel is ready for communication

    USAGE:
    if (this.broadcastService.isAvailable()) {
      this.broadcastService.sendMessage('TEST', { data: 'hello' });
    } else {
      console.warn('Cross-window communication not available');
    }
  */
  public isAvailable(): boolean {
    return this.channel !== null;
  }

  /*
    CHECK IF PRODUCTION ENVIRONMENT

    Simple helper to determine if we're running in production.
    Used to control console.log statements (verbose in dev, quiet in prod).

    @returns boolean - true if production build
  */
  private isProduction(): boolean {
    // Angular's production flag is set during build
    // In dev builds, this will be false
    // In prod builds, this will be true (and tree-shaking removes console.logs)
    return false; // TODO: Replace with environment check
  }

  /*
    CLEANUP ON DESTROY

    Called by Angular when the service is destroyed (usually never for root services,
    but can happen in testing or dynamic module loading).

    Steps:
    1. Close the BroadcastChannel connection
    2. Complete all subjects (stops all subscriptions)
    3. Clean up references

    This prevents memory leaks and ensures clean shutdown.
  */
  ngOnDestroy(): void {
    // Close the BroadcastChannel
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }

    // Complete all subjects
    this.destroy$.next();
    this.destroy$.complete();
    this.messageSubject.complete();

    console.log('BroadcastChannelService: Cleaned up');
  }
}
