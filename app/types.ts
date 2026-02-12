/**
 *  Websocket subscription message type
 */
export type SubscriptionMessage =
  | {
      type: "subscribe";
      payload: { matchId: number };
    }
  | {
      type: "unsubscribe";
      payload: { matchId: number };
    };

/**
 *  Websocket message types sent from the client to the server
 */
export type ClientMessage = SubscriptionMessage;
