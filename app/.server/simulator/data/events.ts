export type EventDefinition = {
  type: string;
  messageTemplates: string[];
  tags: string[];
  requiresScore?: boolean;
};

export const FOOTBALL_EVENTS: Record<string, EventDefinition> = {
  kickoff: {
    type: "kickoff",
    messageTemplates: [
      "Kickoff! The match begins.",
      "The referee blows the whistle, we're underway!",
      "And we're off! {team} gets us started.",
    ],
    tags: ["start"],
  },
  goal: {
    type: "goal",
    messageTemplates: [
      "GOAL! {actor} finds the back of the net for {team}!",
      "It's a goal! {actor} scores for {team}!",
      "Brilliant finish! {actor} puts {team} ahead!",
      "{team} scores! {actor} with a clinical finish!",
    ],
    tags: ["goal"],
    requiresScore: true,
  },
  shot: {
    type: "shot",
    messageTemplates: [
      "{actor} takes a shot from distance!",
      "Effort on goal from {actor}!",
      "{actor} tries his luck from outside the box.",
    ],
    tags: ["chance"],
  },
  save: {
    type: "save",
    messageTemplates: [
      "Great save by the goalkeeper to deny {team}!",
      "The keeper does well to keep that out.",
      "Brilliant goalkeeping! {team} denied.",
    ],
    tags: ["save"],
  },
  foul: {
    type: "foul",
    messageTemplates: [
      "Foul by {actor} on the edge of the box.",
      "{actor} brings down the opponent.",
      "That's a foul, and {actor} knows it.",
    ],
    tags: ["foul"],
  },
  yellow_card: {
    type: "yellow_card",
    messageTemplates: [
      "Yellow card shown to {actor} of {team}.",
      "{actor} goes into the book for {team}.",
      "The referee reaches for his pocket. Yellow for {actor}.",
    ],
    tags: ["card"],
  },
  red_card: {
    type: "red_card",
    messageTemplates: [
      "Red card! {actor} is sent off for {team}!",
      "{actor} sees red! {team} down to 10 men.",
      "Straight red for {actor}! Huge moment in this match.",
    ],
    tags: ["card"],
  },
  substitution: {
    type: "substitution",
    messageTemplates: [
      "Substitution for {team}: {actor} comes on.",
      "{team} makes a change. {actor} enters the pitch.",
      "Tactical switch for {team}. {actor} replaces a tired leg.",
    ],
    tags: ["sub"],
  },
  corner: {
    type: "corner",
    messageTemplates: [
      "Corner kick awarded to {team}.",
      "{team} wins a corner.",
      "Flag goes up, corner for {team}.",
    ],
    tags: ["set_piece"],
  },
  free_kick: {
    type: "free_kick",
    messageTemplates: [
      "Free kick in a dangerous position for {team}.",
      "{actor} stands over the free kick for {team}.",
      "{team} has a chance from the set piece.",
    ],
    tags: ["set_piece"],
  },
  penalty: {
    type: "penalty",
    messageTemplates: [
      "Penalty awarded to {team}!",
      "The referee points to the spot! Penalty for {team}.",
      "Handball in the box! Penalty to {team}.",
    ],
    tags: ["penalty"],
  },
  var: {
    type: "var",
    messageTemplates: [
      "VAR check in progress...",
      "The referee is going to the monitor.",
      "We're waiting for VAR to make a decision.",
    ],
    tags: ["var"],
  },
  halftime: {
    type: "halftime",
    messageTemplates: [
      "Halftime! The teams head to the dressing rooms.",
      "That's the end of the first half.",
      "The whistle blows for halftime.",
    ],
    tags: ["period"],
  },
  fulltime: {
    type: "fulltime",
    messageTemplates: [
      "Full time! The final whistle blows.",
      "That's it! The match has ended.",
      "The referee brings an end to proceedings.",
    ],
    tags: ["period"],
  },
};

export const CRICKET_EVENTS: Record<string, EventDefinition> = {
  wicket: {
    type: "wicket",
    messageTemplates: [
      "WICKET! {actor} is out!",
      "That's out! {actor} has to go.",
      "Massive moment! {actor} departs for {team}.",
    ],
    tags: ["wicket"],
  },
  four: {
    type: "four",
    messageTemplates: [
      "FOUR! {actor} finds the boundary!",
      "Beautifully played by {actor}, races away for four!",
      "{actor} drives elegantly, four runs!",
    ],
    tags: ["boundary"],
  },
  six: {
    type: "six",
    messageTemplates: [
      "SIX! {actor} launches it into the stands!",
      "Massive hit! {actor} sends it sailing over the rope!",
      "That's gone all the way! Maximum for {actor}!",
    ],
    tags: ["boundary"],
  },
  dot_ball: {
    type: "dot_ball",
    messageTemplates: [
      "Dot ball. Good bowling.",
      "No run there, well bowled.",
      "{actor} keeps it tight, no run.",
    ],
    tags: ["dot"],
  },
  single: {
    type: "single",
    messageTemplates: [
      "Quick single taken by {actor}.",
      "They cross for one.",
      "{actor} nudges it for a single.",
    ],
    tags: ["runs"],
  },
  double: {
    type: "double",
    messageTemplates: [
      "Two runs added to the total.",
      "{actor} works it away for a brace.",
      "Good running! They take two.",
    ],
    tags: ["runs"],
  },
  triple: {
    type: "triple",
    messageTemplates: [
      "Three runs! Great running between the wickets.",
      "They push hard, three runs taken.",
      "{actor} converts two into three with good running.",
    ],
    tags: ["runs"],
  },
  maiden_over: {
    type: "maiden_over",
    messageTemplates: [
      "Maiden over! {actor} was excellent there.",
      "Six dots in a row! A maiden for {actor}.",
      "No runs from that over. Maiden for {team}.",
    ],
    tags: ["maiden"],
  },
  powerplay: {
    type: "powerplay",
    messageTemplates: [
      "Powerplay restrictions are now in effect.",
      "We enter the powerplay overs.",
      "Fielding restrictions apply during the powerplay.",
    ],
    tags: ["powerplay"],
  },
  innings_break: {
    type: "innings_break",
    messageTemplates: [
      "That's the end of the innings!",
      "The teams change over. Innings break.",
      "First innings comes to a close.",
    ],
    tags: ["period"],
  },
  match_end: {
    type: "match_end",
    messageTemplates: [
      "That's the match! A thrilling contest!",
      "The final ball is bowled. Match over!",
      "What a game! That concludes proceedings.",
    ],
    tags: ["period"],
  },
};

export const BASKETBALL_EVENTS: Record<string, EventDefinition> = {
  tipoff: {
    type: "tipoff",
    messageTemplates: [
      "Tipoff! The game is underway!",
      "And we're live! The ball goes up.",
      "Game on! {team} wins the tip.",
    ],
    tags: ["start"],
  },
  "2pt": {
    type: "2pt",
    messageTemplates: [
      "{actor} with a nice 2-point basket!",
      "Good bucket! {actor} scores for {team}.",
      "{actor} drives to the rim and scores!",
    ],
    tags: ["score"],
    requiresScore: true,
  },
  "3pt": {
    type: "3pt",
    messageTemplates: [
      "BANG! {actor} from downtown! Three-pointer!",
      "From deep! {actor} drains the three!",
      "{actor} connects from beyond the arc!",
    ],
    tags: ["score", "three"],
    requiresScore: true,
  },
  free_throw: {
    type: "free_throw",
    messageTemplates: [
      "{actor} at the line... drains the free throw!",
      "Free throw good for {actor}.",
      "{actor} converts from the charity stripe.",
    ],
    tags: ["score", "free_throw"],
    requiresScore: true,
  },
  rebound: {
    type: "rebound",
    messageTemplates: [
      "{actor} comes down with the rebound!",
      "Strong board by {actor}.",
      "{actor} secures the rebound for {team}.",
    ],
    tags: ["rebound"],
  },
  assist: {
    type: "assist",
    messageTemplates: [
      "Beautiful pass! {actor} with the assist.",
      "{actor} finds his teammate for the easy bucket.",
      "Great vision from {actor} on that assist.",
    ],
    tags: ["assist"],
  },
  steal: {
    type: "steal",
    messageTemplates: [
      "Steal! {actor} takes it away!",
      "{actor} with quick hands, gets the steal!",
      "Picked off by {actor}! Turnover forced.",
    ],
    tags: ["defense", "steal"],
  },
  block: {
    type: "block",
    messageTemplates: [
      "REJECTED! {actor} with the monster block!",
      "{actor} sends it back! What a block!",
      "Denied! {actor} with the emphatic rejection!",
    ],
    tags: ["defense", "block"],
  },
  turnover: {
    type: "turnover",
    messageTemplates: [
      "Turnover! {team} gives it away.",
      "{actor} loses possession. Turnover called.",
      "Careless play from {team}, and that's a turnover.",
    ],
    tags: ["turnover"],
  },
  timeout: {
    type: "timeout",
    messageTemplates: [
      "{team} calls a timeout.",
      "Timeout on the floor. {team} huddles up.",
      "Whistle blows. Timeout taken by {team}.",
    ],
    tags: ["timeout"],
  },
  foul: {
    type: "foul",
    messageTemplates: [
      "Foul called on {actor}.",
      "{actor} commits the foul.",
      "That's a foul on {team}.",
    ],
    tags: ["foul"],
  },
  quarter_end: {
    type: "quarter_end",
    messageTemplates: [
      "That's the end of the quarter!",
      "Buzzer sounds, quarter comes to a close.",
      "The period ends with {team} in front.",
    ],
    tags: ["period"],
  },
  overtime: {
    type: "overtime",
    messageTemplates: [
      "We're headed to overtime!",
      "Tie game! OT coming up!",
      "Can't separate them! Overtime to follow.",
    ],
    tags: ["period", "overtime"],
  },
  game_end: {
    type: "game_end",
    messageTemplates: [
      "Final buzzer! That's the game!",
      "The game ends! What a contest!",
      "It's all over! Final score confirmed.",
    ],
    tags: ["period"],
  },
};

export function formatEventMessage(
  definition: EventDefinition,
  params: { team?: string; actor?: string },
): string {
  const templates = definition.messageTemplates;

  const template = templates[Math.floor(Math.random() * templates.length)];

  return template
    .replace("{team}", params.team ?? "Unknown Team")
    .replace("{actor}", params.actor ?? "Unknown Player");
}

export function getEventDefinition(
  sport: string,
  eventType: string,
): EventDefinition | undefined {
  const events =
    sport === "football"
      ? FOOTBALL_EVENTS
      : sport === "cricket"
        ? CRICKET_EVENTS
        : sport === "basketball"
          ? BASKETBALL_EVENTS
          : {};

  return events[eventType];
}
