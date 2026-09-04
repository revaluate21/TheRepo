window.WANDER_ROUTES = [
  {
    id:'lisbon-seven-hills', city:'Lisbon', world:'Old Soul', title:'Seven Hills Day',
    subtitle:'Tiles, rooftops, alleys and the full classic Lisbon arc.', vibe:'CLASSIC LISBON', icon:'🌇',
    coverFile:'Praça do Comércio – Lisboa, Portugal (54817271215).jpg', coverQuery:'Lisbon Praça do Comércio panorama',
    duration:[4,6], steps:[18000,24000], km:14.2, best:['morning','day','sunset'], moods:['mindblown','long'],
    climate:['hills','exposed','city'], dayOnly:false, nightSafe:false, difficulty:'HARD',
    description:'The one route that gives you the broadest first-timer Lisbon experience: grand avenues, viewpoints, old neighbourhoods, Alfama and the river.',
    transport:{startQuery:'Parque Eduardo VII, Lisboa, Portugal',startHint:'transit to Parque Eduardo VII',endQuery:'Cais do Sodré, Lisboa, Portugal',note:'Best begun before late afternoon in hot weather. The last third finishes downhill and beside the Tagus.'},
    stops:[
      {name:'Parque Eduardo VII',short:'Parque Eduardo VII',lat:38.730377,lon:-9.153298,query:'Parque Eduardo VII, Lisboa, Portugal',photoFile:'Parque Eduardo VII - Lisbon (52750120427).jpg',photoQuery:'Parque Eduardo VII Lisbon view',clue:'The giant clipped hedges falling toward the city.',type:'VIEW'},
      {name:'Marquês de Pombal',short:'Marquês',lat:38.725272,lon:-9.149782,query:'Praça Marquês de Pombal, Lisboa, Portugal',photoQuery:'Marquês de Pombal Lisbon monument',clue:'The huge roundabout and tall central monument.',type:'CITY'},
      {name:'Miradouro de São Pedro de Alcântara',short:'São Pedro',lat:38.715422,lon:-9.144139,query:'Miradouro de São Pedro de Alcântara, Lisboa, Portugal',photoFile:'Miradouro de São Pedro de Alcântara (13943471369).jpg',photoQuery:'Miradouro São Pedro Alcântara Lisbon',clue:'Terraced garden facing the castle across the valley.',type:'VIEW'},
      {name:'Carmo Convent',short:'Carmo ruins',lat:38.712153,lon:-9.140282,query:'Convento do Carmo, Lisboa, Portugal',photoFile:'Lisbon, the Convento do Carmo.JPG',photoQuery:'Carmo Convent Lisbon ruins',clue:'Roofless Gothic arches open to the sky.',type:'RUINS'},
      {name:'Rossio',short:'Rossio',lat:38.71338,lon:-9.1392,query:'Praça do Rossio, Lisboa, Portugal',photoFile:'Rossio Square Lisbon Portugal.jpg',photoQuery:'Rossio Square Lisbon',clue:'Black-and-white wave pavement and twin fountains.',type:'SQUARE'},
      {name:'Largo do Intendente',short:'Intendente',lat:38.7208,lon:-9.1354,query:'Largo do Intendente Pina Manique, Lisboa, Portugal',photoQuery:'Largo do Intendente Lisbon tiles',clue:'A compact square framed by tiled façades.',type:'STREET'},
      {name:'Miradouro de Monte Agudo',short:'Monte Agudo',lat:38.72612,lon:-9.131516,query:'Miradouro do Monte Agudo, Lisboa, Portugal',photoFile:'Miradouro do Monte Agudo - Lisboa - Portugal (49258087067).jpg',photoQuery:'Miradouro Monte Agudo Lisbon',clue:'A quiet pergola above the northern city.',type:'QUIET'},
      {name:'Miradouro da Senhora do Monte',short:'Senhora do Monte',lat:38.718937,lon:-9.132766,query:'Miradouro da Senhora do Monte, Lisboa, Portugal',photoFile:'Miradouro da Senhora do Monte (38530147244).jpg',photoQuery:'Senhora do Monte Lisbon view',clue:'Tiny chapel beside one of Lisbon’s widest panoramas.',type:'VIEW'},
      {name:'Miradouro da Graça',short:'Graça',lat:38.716523,lon:-9.131543,query:'Miradouro da Graça, Lisboa, Portugal',photoFile:'Miradouro da Graça.jpg',photoQuery:'Miradouro da Graça Lisbon',clue:'Church terrace, pines and rooftops below.',type:'VIEW'},
      {name:'Santa Luzia and Portas do Sol',short:'Santa Luzia',lat:38.711659,lon:-9.130336,query:'Miradouro de Santa Luzia, Lisboa, Portugal',photoFile:'St. Lucy - Miradouro de Santa Luzia - Lisbon (52751066335).jpg',photoQuery:'Miradouro Santa Luzia Lisbon azulejos',clue:'Blue tiles, bougainvillea and Alfama roofs.',type:'VIEW'},
      {name:'Lisbon Cathedral',short:'Sé Cathedral',lat:38.709801,lon:-9.133064,query:'Sé de Lisboa, Lisboa, Portugal',photoFile:'Sé de Lisboa (Lisbon Cathedral) 112.jpg',photoQuery:'Lisbon Cathedral facade',clue:'Fortress-like twin towers squeezed into the street.',type:'LANDMARK'},
      {name:'Praça do Comércio',short:'Praça do Comércio',lat:38.707519,lon:-9.13635,query:'Praça do Comércio, Lisboa, Portugal',photoFile:'Praça do Comércio – Lisboa, Portugal (54817271215).jpg',photoQuery:'Praça do Comércio Lisbon',clue:'A vast yellow square opening directly onto the river.',type:'SQUARE'},
      {name:'Ribeira das Naus',short:'Ribeira das Naus',lat:38.7066,lon:-9.142,query:'Ribeira das Naus, Lisboa, Portugal',photoQuery:'Ribeira das Naus Lisbon sunset',clue:'Wide stone steps beside the Tagus.',type:'RIVER'},
      {name:'Cais do Sodré',short:'Cais do Sodré',lat:38.70586,lon:-9.145809,query:'Cais do Sodré, Lisboa, Portugal',photoFile:'Cais do Sodre, Lisbon (DSC03382).jpg',photoQuery:'Cais do Sodré Lisbon station',clue:'The waterfront transport hub at the finish.',type:'FINISH'}
    ]
  },
  {
    id:'lisbon-after-dark', city:'Lisbon', world:'Night City', title:'Lisbon After Dark',
    subtitle:'Lit viewpoints, glowing streets and cool river air.', vibe:'NIGHT WALK', icon:'🌙',
    coverFile:'Lisbon Pink Street.jpg', coverQuery:'Lisbon night Pink Street',
    duration:[2.5,4], steps:[12000,18000], km:9.4, best:['sunset','night'], moods:['night','cool','mindblown'],
    climate:['river','city','breeze'], dayOnly:false, nightSafe:true, difficulty:'MEDIUM',
    description:'A deliberately central night route on brighter streets, with viewpoints first and the river as the long cooldown.',
    transport:{startQuery:'Praça Marquês de Pombal, Lisboa, Portugal',startHint:'transit to Marquês de Pombal',endQuery:'Cais do Sodré, Lisboa, Portugal',note:'Stay aware on quiet side streets and use transparency mode near crossings. Night transport changes by hour—always use the live GO HOME link.'},
    stops:[
      {name:'Marquês de Pombal',short:'Marquês',lat:38.725272,lon:-9.149782,query:'Praça Marquês de Pombal, Lisboa, Portugal',photoQuery:'Marquês de Pombal Lisbon night',clue:'The illuminated monument at the top of Avenida.',type:'START'},
      {name:'Avenida da Liberdade',short:'Avenida',lat:38.7216,lon:-9.1464,query:'Avenida da Liberdade, Lisboa, Portugal',photoQuery:'Avenida da Liberdade Lisbon night',clue:'A long tree-lined boulevard under city lights.',type:'CITY'},
      {name:'Miradouro de São Pedro de Alcântara',short:'São Pedro',lat:38.715422,lon:-9.144139,query:'Miradouro de São Pedro de Alcântara, Lisboa, Portugal',photoFile:'Miradouro de São Pedro de Alcântara (13943471369).jpg',photoQuery:'São Pedro Alcântara Lisbon night',clue:'The castle and eastern hills glittering across the valley.',type:'VIEW'},
      {name:'Rossio',short:'Rossio',lat:38.71338,lon:-9.1392,query:'Praça do Rossio, Lisboa, Portugal',photoFile:'Rossio Square Lisbon Portugal.jpg',photoQuery:'Rossio Lisbon at night',clue:'Wave pavement and bright façades.',type:'SQUARE'},
      {name:'Rua Augusta Arch',short:'Rua Augusta',lat:38.70874,lon:-9.13683,query:'Arco da Rua Augusta, Lisboa, Portugal',photoQuery:'Rua Augusta Arch Lisbon night',clue:'The triumphal arch at the river end of the pedestrian street.',type:'LANDMARK'},
      {name:'Praça do Comércio',short:'Praça do Comércio',lat:38.707519,lon:-9.13635,query:'Praça do Comércio, Lisboa, Portugal',photoFile:'Praça do Comércio – Lisboa, Portugal (54817271215).jpg',photoQuery:'Praça do Comércio Lisbon night',clue:'Huge open square and black river beyond.',type:'SQUARE'},
      {name:'Ribeira das Naus',short:'River walk',lat:38.7066,lon:-9.142,query:'Ribeira das Naus, Lisboa, Portugal',photoQuery:'Ribeira das Naus Lisbon night',clue:'Low waterfront promenade with open air and breeze.',type:'RIVER'},
      {name:'Miradouro de Santa Catarina',short:'Santa Catarina',lat:38.71048,lon:-9.14784,query:'Miradouro de Santa Catarina, Lisboa, Portugal',photoQuery:'Miradouro Santa Catarina Lisbon sunset',clue:'Terrace facing the bridge and westward river.',type:'VIEW'},
      {name:'Bica Street',short:'Bica',lat:38.71007,lon:-9.14653,query:'Elevador da Bica, Lisboa, Portugal',photoFile:'Elevador da Bica - Lisbon (52750990701).jpg',photoQuery:'Bica Lisbon street night',clue:'A steep rail-lined street framed by old buildings.',type:'STREET'},
      {name:'Pink Street',short:'Pink Street',lat:38.70752,lon:-9.14372,query:'Pink Street, Lisboa, Portugal',photoFile:'Lisbon Pink Street.jpg',photoQuery:'Pink Street Lisbon night',clue:'Bright pink ground beneath the arches.',type:'NEON'},
      {name:'Cais do Sodré',short:'Cais do Sodré',lat:38.70586,lon:-9.145809,query:'Cais do Sodré, Lisboa, Portugal',photoFile:'Cais do Sodre, Lisbon (DSC03382).jpg',photoQuery:'Cais do Sodré Lisbon night',clue:'Transport hub beside the river.',type:'FINISH'}
    ]
  },
  {
    id:'belem-alcantara', city:'Lisbon', world:'Monumental River', title:'Belém to Alcântara',
    subtitle:'Empire-scale stone, modern curves and one long riverside line.', vibe:'RIVER + MONUMENTS', icon:'⛵',
    coverQuery:'Torre de Belém Lisbon Portugal sunset',
    duration:[3,4.5], steps:[13000,19000], km:11.6, best:['morning','day','sunset'], moods:['mindblown','cool','long'],
    climate:['river','breeze','exposed'], dayOnly:false, nightSafe:true, difficulty:'EASY',
    description:'Lisbon’s easiest big-experience route: almost flat, visually varied and cooled by the Tagus.',
    transport:{startQuery:'Estação de Belém, Lisboa, Portugal',startHint:'train or tram to Belém',endQuery:'Estação Alcântara-Mar, Lisboa, Portugal',note:'In strong heat, begin late and walk east with the evening light. Monument interiors have separate opening hours.'},
    stops:[
      {name:'Belém Station',short:'Belém',lat:38.69674,lon:-9.19872,query:'Estação de Belém, Lisboa, Portugal',photoQuery:'Belém Lisbon train station',clue:'Small riverside rail stop: your flat route begins here.',type:'START'},
      {name:'Jerónimos Monastery',short:'Jerónimos',lat:38.69788,lon:-9.20656,query:'Mosteiro dos Jerónimos, Lisboa, Portugal',photoQuery:'Jerónimos Monastery Lisbon facade',clue:'An enormous pale stone façade covered in carved detail.',type:'LANDMARK'},
      {name:'Centro Cultural de Belém',short:'CCB',lat:38.69535,lon:-9.2096,query:'Centro Cultural de Belém, Lisboa, Portugal',photoQuery:'Centro Cultural de Belém architecture',clue:'Modern sandstone blocks facing a large open plaza.',type:'DESIGN'},
      {name:'Belém Tower',short:'Belém Tower',lat:38.69158,lon:-9.21602,query:'Torre de Belém, Lisboa, Portugal',photoQuery:'Torre de Belém Lisbon water',clue:'A stone fortress rising from the river edge.',type:'LANDMARK'},
      {name:'Monument to the Discoveries',short:'Discoveries',lat:38.6936,lon:-9.20569,query:'Padrão dos Descobrimentos, Lisboa, Portugal',photoQuery:'Padrão dos Descobrimentos Lisbon',clue:'A giant stone ship-prow lined with explorers.',type:'LANDMARK'},
      {name:'MAAT',short:'MAAT',lat:38.69595,lon:-9.19458,query:'MAAT, Lisboa, Portugal',photoQuery:'MAAT Lisbon curved building',clue:'A white wave-shaped roof you can walk over.',type:'FUTURE'},
      {name:'LX Factory',short:'LX Factory',lat:38.70373,lon:-9.17851,query:'LX Factory, Lisboa, Portugal',photoQuery:'LX Factory Lisbon industrial street art',clue:'Brick industrial courtyards, steel and large murals.',type:'INDUSTRIAL'},
      {name:'Docas de Santo Amaro',short:'Docas',lat:38.69974,lon:-9.17818,query:'Docas de Santo Amaro, Lisboa, Portugal',photoQuery:'Docas Santo Amaro Lisbon bridge',clue:'Warehouses directly beneath the red suspension bridge.',type:'RIVER'},
      {name:'Alcântara-Mar Station',short:'Alcântara-Mar',lat:38.70193,lon:-9.17893,query:'Estação de Alcântara-Mar, Lisboa, Portugal',photoQuery:'Alcântara Mar Lisbon station',clue:'The coastal-line station for your return.',type:'FINISH'}
    ]
  },
  {
    id:'parque-nacoes-future', city:'Lisbon', world:'Future Waterfront', title:'Parque das Nações',
    subtitle:'Glass, giant structures, long boardwalks and open sky.', vibe:'CYBERPUNK-LITE', icon:'🌌',
    coverQuery:'Parque das Nações Lisbon waterfront night',
    duration:[2.5,4], steps:[11000,18000], km:10.8, best:['sunset','night','day'], moods:['peaceful','cool','night','mindblown'],
    climate:['river','breeze','open'], dayOnly:false, nightSafe:true, difficulty:'EASY',
    description:'The sharpest contrast with old Lisbon: futuristic infrastructure, huge open spaces and a very easy river walk.',
    transport:{startQuery:'Gare do Oriente, Lisboa, Portugal',startHint:'Metro or train to Oriente',endQuery:'Gare do Oriente, Lisboa, Portugal',note:'Excellent after sunset and one of the least stressful long walks in hot weather.'},
    stops:[
      {name:'Gare do Oriente',short:'Oriente',lat:38.76792,lon:-9.09908,query:'Gare do Oriente, Lisboa, Portugal',photoQuery:'Gare do Oriente Lisbon Calatrava roof',clue:'A huge white steel canopy like a sci-fi skeleton.',type:'FUTURE'},
      {name:'Vasco da Gama Centre Canopy',short:'Vasco da Gama',lat:38.76816,lon:-9.0958,query:'Centro Vasco da Gama, Lisboa, Portugal',photoQuery:'Centro Vasco da Gama Lisbon canopy',clue:'A long translucent roof spilling toward the river.',type:'CITY'},
      {name:'Pavilhão de Portugal',short:'Portugal Pavilion',lat:38.76575,lon:-9.09433,query:'Pavilhão de Portugal, Lisboa, Portugal',photoQuery:'Pavilhão de Portugal Siza Lisbon canopy',clue:'A monumental concrete sheet hanging like fabric.',type:'DESIGN'},
      {name:'Oceanário Exterior',short:'Oceanário',lat:38.76355,lon:-9.09368,query:'Oceanário de Lisboa, Portugal',photoQuery:'Oceanário de Lisboa exterior water',clue:'A square building floating over reflecting water.',type:'FUTURE'},
      {name:'Jardim Garcia de Orta',short:'Garcia de Orta',lat:38.77202,lon:-9.09318,query:'Jardim Garcia de Orta, Lisboa, Portugal',photoQuery:'Jardim Garcia de Orta Lisbon waterfront',clue:'Linear gardens with unusual plants beside the promenade.',type:'GREEN'},
      {name:'Vasco da Gama Tower',short:'Vasco da Gama Tower',lat:38.77486,lon:-9.09248,query:'Torre Vasco da Gama, Lisboa, Portugal',photoQuery:'Vasco da Gama Tower Lisbon',clue:'A slender sail-shaped tower over the river.',type:'SKYLINE'},
      {name:'Passeio do Tejo',short:'Tagus boardwalk',lat:38.78235,lon:-9.09222,query:'Passeio do Tejo Parque das Nações, Lisboa, Portugal',photoQuery:'Parque das Nações boardwalk Tagus',clue:'An open boardwalk with bridge and estuary views.',type:'RIVER'},
      {name:'Parque Tejo',short:'Parque Tejo',lat:38.7932,lon:-9.0923,query:'Parque Tejo, Lisboa, Portugal',photoQuery:'Parque Tejo Lisbon sunset',clue:'Huge lawns and sky beneath the Vasco da Gama Bridge.',type:'QUIET'},
      {name:'Gare do Oriente Return',short:'Oriente return',lat:38.76792,lon:-9.09908,query:'Gare do Oriente, Lisboa, Portugal',photoQuery:'Gare do Oriente Lisbon night',clue:'Return to the glowing transport cathedral.',type:'FINISH',legMode:'transit'}
    ]
  },
  {
    id:'almada-skyline', city:'Almada', world:'Across the Water', title:'Cacilhas to Cristo Rei',
    subtitle:'Ferry, abandoned-looking river walls and Lisbon’s best skyline.', vibe:'SUNSET WORLD', icon:'⛴️',
    coverQuery:'Cristo Rei Almada Lisbon skyline sunset',
    duration:[3,4.5], steps:[12000,18000], km:10.5, best:['sunset','day'], moods:['mindblown','peaceful','cool','trip'],
    climate:['river','breeze','hills'], dayOnly:false, nightSafe:false, difficulty:'MEDIUM',
    description:'Crossing the river makes Lisbon feel like a completely different world: quiet waterfront, cliff views and the bridge overhead.',
    transport:{startQuery:'Terminal Fluvial de Cacilhas, Almada, Portugal',startHint:'ferry from Cais do Sodré to Cacilhas',endQuery:'Santuário de Cristo Rei, Almada, Portugal',note:'Casa da Cerca garden has daytime opening hours; the exterior viewpoints and riverside still work outside them. Return by live bus/ferry routing.',officialUrl:'https://ttsl.pt/'},
    stops:[
      {name:'Cacilhas Ferry Terminal',short:'Cacilhas',lat:38.68703,lon:-9.14836,query:'Terminal Fluvial de Cacilhas, Almada, Portugal',photoQuery:'Cacilhas ferry Lisbon skyline',clue:'Step off the ferry facing Lisbon across the water.',type:'START'},
      {name:'Cacilhas Lighthouse',short:'Cacilhas lighthouse',lat:38.68613,lon:-9.14953,query:'Farol de Cacilhas, Almada, Portugal',photoQuery:'Farol de Cacilhas Lisbon',clue:'A small red lighthouse beside the ferry basin.',type:'RIVER'},
      {name:'Ginjal Waterfront',short:'Ginjal',lat:38.68416,lon:-9.15614,query:'Cais do Ginjal, Almada, Portugal',photoQuery:'Cais do Ginjal Almada abandoned waterfront',clue:'Long weathered river walls directly opposite Lisbon.',type:'ATMOSPHERE'},
      {name:'Jardim do Rio',short:'Jardim do Rio',lat:38.68431,lon:-9.15752,query:'Jardim do Rio, Almada, Portugal',photoQuery:'Jardim do Rio Almada Lisbon view',clue:'A green riverside pocket beneath the cliff.',type:'QUIET'},
      {name:'Boca do Vento',short:'Boca do Vento',lat:38.6849,lon:-9.15861,query:'Elevador Panorâmico da Boca do Vento, Almada, Portugal',photoQuery:'Boca do Vento Almada panoramic elevator',clue:'A glass lift climbing the cliff above the river.',type:'VIEW'},
      {name:'Casa da Cerca Viewpoint',short:'Casa da Cerca',lat:38.68372,lon:-9.15975,query:'Casa da Cerca, Almada, Portugal',photoQuery:'Casa da Cerca Almada Lisbon view',clue:'Botanical terraces looking straight at Lisbon and the bridge.',type:'QUIET'},
      {name:'Cristo Rei',short:'Cristo Rei',lat:38.67858,lon:-9.17154,query:'Santuário de Cristo Rei, Almada, Portugal',photoQuery:'Cristo Rei Almada Lisbon panorama',clue:'The giant statue above the 25 de Abril Bridge.',type:'VIEW'}
    ]
  },
  {
    id:'monsanto-green-escape', city:'Lisbon', world:'Green Escape', title:'Monsanto Panorama',
    subtitle:'Forest paths, abandoned-modernist atmosphere and a city overlook.', vibe:'RDR2 × URBAN RUIN', icon:'🌲',
    coverQuery:'Panorâmico de Monsanto Lisbon abandoned viewpoint',
    duration:[3,5], steps:[13000,21000], km:12.2, best:['morning','day'], moods:['peaceful','mindblown','long','cool'],
    climate:['forest','shade','hills'], dayOnly:true, nightSafe:false, difficulty:'HARD',
    description:'The closest real escape from Lisbon’s buildings: pine forest, steep trails and a surreal panoramic structure.',
    transport:{startQuery:'Parque Recreativo do Alvito, Lisboa, Portugal',startHint:'live transit to Parque do Alvito',endQuery:'Parque Recreativo do Alvito, Lisboa, Portugal',note:'Daylight only. Trails and access can change, so follow posted closures and do not enter fenced structures.'},
    stops:[
      {name:'Parque Recreativo do Alvito',short:'Alvito',lat:38.72428,lon:-9.18443,query:'Parque Recreativo do Alvito, Lisboa, Portugal',photoQuery:'Parque do Alvito Monsanto Lisbon',clue:'Wooded recreation area at the forest edge.',type:'START'},
      {name:'Moinhos de Santana',short:'Santana windmills',lat:38.72778,lon:-9.18949,query:'Moinhos de Santana, Lisboa, Portugal',photoQuery:'Moinhos de Santana Monsanto Lisbon',clue:'Old windmills rising above the tree line.',type:'VIEW'},
      {name:'Parque da Pedra',short:'Parque da Pedra',lat:38.7283,lon:-9.1971,query:'Parque da Pedra, Monsanto, Lisboa, Portugal',photoQuery:'Parque da Pedra Monsanto Lisbon',clue:'Rocky clearings among dense woodland.',type:'FOREST'},
      {name:'Panorâmico de Monsanto',short:'Panorâmico',lat:38.72943,lon:-9.20422,query:'Panorâmico de Monsanto, Lisboa, Portugal',photoQuery:'Panorâmico de Monsanto Lisbon graffiti view',clue:'A circular concrete panorama covered in layered street art.',type:'ATMOSPHERE'},
      {name:'Keil do Amaral Amphitheatre',short:'Keil do Amaral',lat:38.73475,lon:-9.20293,query:'Parque Recreativo do Alto da Serafina Keil do Amaral, Lisboa, Portugal',photoQuery:'Keil do Amaral Monsanto Lisbon park',clue:'Broad forest lawns and an outdoor amphitheatre.',type:'QUIET'},
      {name:'Alvito Return',short:'Alvito return',lat:38.72428,lon:-9.18443,query:'Parque Recreativo do Alvito, Lisboa, Portugal',photoQuery:'Monsanto Lisbon forest trail',clue:'Return to the transport side of the forest.',type:'FINISH'}
    ]
  }
];
