'use strict';
// Date-stamped nightlife side quests for the night of 3 → 4 September 2026.
const NIGHTLIFE_NOW = [
  {
    id:'ministerium-riktus-2026-09-03',
    name:'Ministerium Club · Riktus Industrial Night',
    short:'Ministerium · Riktus',
    lat:38.7101156,
    lon:-9.1323115,
    category:'nightlife',
    icon:'🔊',
    color:'#7b61ff',
    status:'LIVE NOW · 23:59–08:00 · 18+',
    adds:'Almost zero detour from Praça do Comércio',
    note:'Riktus is running through 08:00 with Angel Karel, BLNK, LIEKS, DRKOO and Morgaz. The event is billed as techno + hardcore with heavy kicks and dark industrial atmospheres.',
    tip:'Closest match to the darker, music-first White Hotel energy you described. The entrance is under the eastern arcade at Praça do Comércio 72. Bring photo ID; entry remains subject to capacity.',
    query:'Ministerium Club, Praça do Comércio 72, 1100-148 Lisboa, Portugal',
    eventUrl:'https://ra.co/events/2509556'
  },
  {
    id:'loucura-under-bridge-2026-09-03',
    name:'Loucura · Under the Bridge',
    short:'Loucura · Pink Street',
    lat:38.70747,
    lon:-9.14392,
    category:'nightlife',
    icon:'🌈',
    color:'#ff3ec9',
    status:'LIVE NOW · 23:00–06:00 · 18+',
    adds:'On Pink Street beside the route finish',
    note:'Thursday night at Loucura is Afro House and remixes rather than industrial techno. It is a very easy social backup because it sits directly on Pink Street.',
    tip:'Use this if you want a lively crowd and easy route logistics more than underground hard techno. The free-list period has already ended, so check the door price.',
    query:'Loucura, Rua Nova do Carvalho 24, Lisboa, Portugal',
    eventUrl:'https://site.fourvenues.com/en/aaulht/events/ZBD9'
  },
  {
    id:'casa-capitao-weird-baile-2026-09-03',
    name:'Casa Capitão · Weird Baile & FOMO',
    short:'Casa Capitão · free',
    lat:38.72965,
    lon:-9.10775,
    category:'nightlife',
    icon:'🌀',
    color:'#35c98f',
    status:'LIVE NOW · 00:00–06:00 · FREE',
    adds:'Farther east in Beato — rideshare recommended',
    note:'A free two-room night: Weird Baile downstairs and FOMO upstairs. More left-field Brazilian/club energy than straight techno.',
    tip:'Interesting value, but it is not on the walking route. At this hour use a Bolt/Uber rather than spending your best two hours walking to Beato.',
    query:'Casa Capitão, Rua do Grilo 119, Lisboa, Portugal',
    eventUrl:'https://ma.to/event/weird-baile-fomo-03-sep-2026'
  },
  {
    id:'lux-granada-scully-2026-09-03',
    name:'Lux Frágil · André Granada & Dana Scully',
    short:'Lux · until 04:00',
    lat:38.71825,
    lon:-9.11838,
    category:'nightlife',
    icon:'🪩',
    color:'#ff9f1c',
    status:'ENDING SOON · listed until 04:00',
    adds:'East of Alfama / Santa Apolónia',
    note:'A polished Lisbon electronic institution, but tonight’s listing ends at 04:00, so it is now a last-call option rather than the best use of the night.',
    tip:'Only choose this if you specifically want Lux and can head there immediately. Riktus and the 06:00 options give you much more usable time.',
    query:'Lux Frágil, Avenida Infante Dom Henrique, Lisboa, Portugal',
    eventUrl:'https://ra.co/events/2526086'
  }
];
DATA.sidequests.unshift(...NIGHTLIFE_NOW);
