window.WANDER_ROUTES.push(
  {
    id:'sintra-palaces-peaks', city:'Sintra', world:'Fairy-Tale Mountain', title:'Palaces & Peaks',
    subtitle:'Pena colours, castle walls, forest paths and impossible views.', vibe:'ULTIMATE FANTASY', icon:'🏰',
    coverQuery:'Pena Palace Sintra Portugal panoramic',
    duration:[6,8], steps:[18000,28000], km:15.8, best:['morning','day'], moods:['mindblown','long','trip','cool'],
    climate:['forest','shade','hills'], dayOnly:true, nightSafe:false, difficulty:'VERY HARD',
    description:'The full Sintra experience. Start early, combine the old town with Regaleira, the mountain trail, Moorish walls and Pena’s park.',
    transport:{startQuery:'Estação de Sintra, Portugal',startHint:'train to Sintra station',endQuery:'Estação de Sintra, Portugal',note:'Book timed attractions before travelling. Forest access can change with wind, fire risk or maintenance—check Parques de Sintra on the day.',officialUrl:'https://bilheteira.parquesdesintra.pt/'},
    stops:[
      {name:'Sintra Station',short:'Sintra station',lat:38.79884,lon:-9.38693,query:'Estação de Sintra, Portugal',photoQuery:'Sintra railway station azulejos',clue:'Blue-and-white tiled station at the edge of town.',type:'START'},
      {name:'Sintra Historic Centre',short:'Old Sintra',lat:38.79739,lon:-9.39072,query:'Centro Histórico de Sintra, Portugal',photoQuery:'Sintra historic centre National Palace',clue:'White palace chimneys rising over a tight old town.',type:'TOWN'},
      {name:'Quinta da Regaleira',short:'Regaleira',lat:38.79635,lon:-9.39672,query:'Quinta da Regaleira, Sintra, Portugal',photoQuery:'Quinta da Regaleira Sintra Initiation Well palace',clue:'Gothic towers, mossy gardens and the spiral Initiation Well.',type:'FANTASY'},
      {name:'Palácio de Seteais',short:'Seteais',lat:38.79675,lon:-9.39983,query:'Palácio de Seteais, Sintra, Portugal',photoQuery:'Palácio de Seteais Sintra arch view',clue:'A pale neoclassical arch framing the distant palace hill.',type:'VIEW'},
      {name:'Vila Sassetti Trail Entrance',short:'Sassetti trail',lat:38.79311,lon:-9.39202,query:'Vila Sassetti, Sintra, Portugal',photoQuery:'Vila Sassetti trail Sintra forest',clue:'A romantic ochre villa where the forest climb begins.',type:'FOREST'},
      {name:'Moorish Castle',short:'Moorish Castle',lat:38.79264,lon:-9.38943,query:'Castelo dos Mouros, Sintra, Portugal',photoQuery:'Moorish Castle Sintra walls panorama',clue:'Stone battlements zigzagging across the ridge.',type:'EPIC'},
      {name:'Pena Palace',short:'Pena Palace',lat:38.78759,lon:-9.39063,query:'Palácio Nacional da Pena, Sintra, Portugal',photoQuery:'Pena Palace Sintra colourful towers',clue:'Red and yellow towers exploding above the forest.',type:'EPIC'},
      {name:'Pena Park Lakes',short:'Pena lakes',lat:38.7892,lon:-9.3942,query:'Vale dos Lagos Parque da Pena, Sintra, Portugal',photoQuery:'Vale dos Lagos Pena Park Sintra',clue:'Quiet lakes, ferny paths and castle-like duck houses.',type:'QUIET'},
      {name:'Chalet of the Countess of Edla',short:'Countess chalet',lat:38.78579,lon:-9.39714,query:'Chalet da Condessa d’Edla, Sintra, Portugal',photoQuery:'Chalet Countess Edla Sintra cork facade',clue:'A colourful alpine chalet wrapped in cork detail.',type:'FANTASY'},
      {name:'Sintra Station Return',short:'Station return',lat:38.79884,lon:-9.38693,query:'Estação de Sintra, Portugal',photoQuery:'Sintra station Portugal',clue:'Use live bus or walking directions back down.',type:'FINISH',legMode:'transit'}
    ]
  },
  {
    id:'sintra-monserrate-dream', city:'Sintra', world:'Secret Garden', title:'Monserrate Dream',
    subtitle:'A quieter palace, giant ferns, ruins and cinematic gardens.', vibe:'PEACEFUL FANTASY', icon:'🌿',
    coverQuery:'Monserrate Palace Sintra gardens Portugal',
    duration:[4,6], steps:[10000,17000], km:9.1, best:['morning','day'], moods:['peaceful','mindblown','trip','cool'],
    climate:['forest','shade','garden'], dayOnly:true, nightSafe:false, difficulty:'MEDIUM',
    description:'The calmer alternative to palace-hopping: old Sintra first, then live transit to one of Portugal’s most atmospheric landscaped parks.',
    transport:{startQuery:'Estação de Sintra, Portugal',startHint:'train to Sintra station',endQuery:'Parque e Palácio de Monserrate, Sintra, Portugal',note:'Use live transit from Sintra town to Monserrate rather than blindly walking the roadside. Check opening/access before departure.',officialUrl:'https://bilheteira.parquesdesintra.pt/'},
    stops:[
      {name:'Sintra Station',short:'Sintra station',lat:38.79884,lon:-9.38693,query:'Estação de Sintra, Portugal',photoQuery:'Sintra railway station Portugal',clue:'Tiled station and the start of the green hills.',type:'START'},
      {name:'Sintra Historic Centre',short:'Old Sintra',lat:38.79739,lon:-9.39072,query:'Centro Histórico de Sintra, Portugal',photoQuery:'Sintra historic centre palace chimneys',clue:'The twin white chimneys above the old town.',type:'TOWN'},
      {name:'Palácio de Seteais View',short:'Seteais',lat:38.79675,lon:-9.39983,query:'Palácio de Seteais, Sintra, Portugal',photoQuery:'Seteais Sintra palace arch Pena view',clue:'A grand arch opening toward Pena hill.',type:'VIEW'},
      {name:'Monserrate Entrance',short:'Monserrate',lat:38.79391,lon:-9.42073,query:'Parque e Palácio de Monserrate, Sintra, Portugal',photoQuery:'Monserrate Palace Sintra entrance',clue:'Enter a dense garden world far quieter than central Sintra.',type:'GARDEN',legMode:'transit'},
      {name:'Monserrate Palace',short:'Monserrate Palace',lat:38.79417,lon:-9.42186,query:'Palácio de Monserrate, Sintra, Portugal',photoQuery:'Monserrate Palace Sintra interior exterior',clue:'An ornate pink-and-stone palace with a long domed corridor.',type:'FANTASY'},
      {name:'Mexican Garden',short:'Mexican Garden',lat:38.7933,lon:-9.4232,query:'Jardim do México Monserrate, Sintra, Portugal',photoQuery:'Mexican Garden Monserrate Sintra',clue:'Huge succulents and warm colours against the forest.',type:'OTHERWORLD'},
      {name:'Ruined Chapel',short:'Ruined chapel',lat:38.79502,lon:-9.42364,query:'Ruínas da Capela de Monserrate, Sintra, Portugal',photoQuery:'Ruined chapel Monserrate Sintra moss',clue:'A moss-covered ruin swallowed by roots and greenery.',type:'RDR2'},
      {name:'Monserrate Lawns and Lakes',short:'Lawns and lakes',lat:38.79456,lon:-9.4211,query:'Parque de Monserrate, Sintra, Portugal',photoQuery:'Monserrate Park Sintra lawn lake',clue:'A huge rolling lawn beneath exotic trees.',type:'QUIET'},
      {name:'Monserrate Exit',short:'Monserrate exit',lat:38.79391,lon:-9.42073,query:'Parque e Palácio de Monserrate, Sintra, Portugal',photoQuery:'Monserrate Sintra park gate',clue:'Return to the main entrance for live transit home.',type:'FINISH'}
    ]
  },
  {
    id:'cascais-atlantic', city:'Cascais', world:'Atlantic Edge', title:'Cascais to Guincho',
    subtitle:'Sea cliffs, huge sky and an endless coastal path.', vibe:'ATLANTIC CINEMA', icon:'🌊',
    coverQuery:'Boca do Inferno Cascais Portugal Atlantic coast',
    duration:[4,6], steps:[17000,27000], km:17.3, best:['morning','day','sunset'], moods:['peaceful','mindblown','cool','long','trip'],
    climate:['coast','breeze','exposed'], dayOnly:false, nightSafe:false, difficulty:'LONG',
    description:'A nearly unbroken walk from elegant Cascais to raw Atlantic cliffs and Guincho. The natural choice in serious heat.',
    transport:{startQuery:'Estação de Cascais, Portugal',startHint:'train from Cais do Sodré to Cascais',endQuery:'Praia do Guincho, Cascais, Portugal',note:'Wind can become strong near Guincho. Use live bus directions back to Cascais rather than walking the full distance twice.',officialUrl:'https://www.cp.pt/'},
    stops:[
      {name:'Cascais Station',short:'Cascais',lat:38.70079,lon:-9.41872,query:'Estação de Cascais, Portugal',photoQuery:'Cascais Portugal town station coast',clue:'Step out into the compact seaside centre.',type:'START'},
      {name:'Praia da Rainha',short:'Rainha cove',lat:38.70005,lon:-9.42012,query:'Praia da Rainha, Cascais, Portugal',photoQuery:'Praia da Rainha Cascais cove',clue:'A tiny turquoise cove hidden between town walls.',type:'SEA'},
      {name:'Cascais Citadel',short:'Citadel',lat:38.69595,lon:-9.42155,query:'Cidadela de Cascais, Portugal',photoQuery:'Cascais Citadel marina',clue:'Fortress walls beside the marina.',type:'HISTORY'},
      {name:'Parque Marechal Carmona',short:'Carmona park',lat:38.69335,lon:-9.42288,query:'Parque Marechal Carmona, Cascais, Portugal',photoQuery:'Parque Marechal Carmona Cascais peacocks',clue:'Shaded gardens, ponds and roaming birds.',type:'QUIET'},
      {name:'Boca do Inferno',short:'Boca do Inferno',lat:38.69165,lon:-9.43052,query:'Boca do Inferno, Cascais, Portugal',photoQuery:'Boca do Inferno Cascais cliff arch waves',clue:'Atlantic water thundering into a collapsed sea cave.',type:'EPIC'},
      {name:'Casa da Guia',short:'Casa da Guia',lat:38.69585,lon:-9.4445,query:'Casa da Guia, Cascais, Portugal',photoQuery:'Casa da Guia Cascais coastline lighthouse',clue:'Clifftop grounds and a lighthouse facing open ocean.',type:'SEA'},
      {name:'Guia Coastal Path',short:'Guia path',lat:38.70358,lon:-9.45728,query:'Ciclovia do Guincho, Cascais, Portugal',photoQuery:'Cascais Guincho coastal path Atlantic',clue:'A long ribbon of path with almost nothing between you and the sea.',type:'WALK'},
      {name:'Forte de São Jorge de Oitavos',short:'Oitavos fort',lat:38.70436,lon:-9.46829,query:'Forte de São Jorge de Oitavos, Cascais, Portugal',photoQuery:'Forte Oitavos Cascais Atlantic',clue:'A low stone fort above a wild rocky coast.',type:'HISTORY'},
      {name:'Guincho Dunes',short:'Guincho dunes',lat:38.7277,lon:-9.4741,query:'Dunas do Guincho, Cascais, Portugal',photoQuery:'Guincho dunes Cascais Portugal',clue:'Wind-shaped dunes with Sintra’s hills behind them.',type:'OTHERWORLD'},
      {name:'Praia do Guincho',short:'Guincho',lat:38.73136,lon:-9.47233,query:'Praia do Guincho, Cascais, Portugal',photoQuery:'Praia do Guincho Cascais sunset',clue:'A vast Atlantic beach beneath the Sintra mountains.',type:'FINISH'}
    ]
  },
  {
    id:'coimbra-grand', city:'Coimbra', world:'Ancient Academy', title:'Coimbra Grand Day',
    subtitle:'Stone lanes, the university above and the Mondego below.', vibe:'OLD-WORLD CITY', icon:'📚',
    coverQuery:'University of Coimbra Paço das Escolas panorama',
    duration:[5,7], steps:[16000,24000], km:14.6, best:['morning','day'], moods:['mindblown','peaceful','long','trip'],
    climate:['city','hills','garden','river'], dayOnly:true, nightSafe:false, difficulty:'HARD',
    description:'A full vertical sweep through Coimbra: old downtown, university courtyards, botanical shade and both sides of the Mondego.',
    transport:{startQuery:'Coimbra-B, Portugal',startHint:'intercity train to Coimbra-B, then live local transit',endQuery:'Coimbra-B, Portugal',note:'This is a full-day train trip. Buy/check long-distance trains in advance and begin early during hot weather.',officialUrl:'https://www.cp.pt/'},
    stops:[
      {name:'Coimbra-B Station',short:'Coimbra-B',lat:40.22544,lon:-8.44087,query:'Coimbra-B, Portugal',photoQuery:'Coimbra B railway station Portugal',clue:'Mainline station: use live transit toward Baixa.',type:'START'},
      {name:'Praça 8 de Maio and Santa Cruz',short:'Santa Cruz',lat:40.21118,lon:-8.42933,query:'Mosteiro de Santa Cruz, Coimbra, Portugal',photoQuery:'Santa Cruz Monastery Coimbra square',clue:'A carved monastery façade at the head of a lively stone square.',type:'HISTORY',legMode:'transit'},
      {name:'Arco de Almedina',short:'Almedina arch',lat:40.20889,lon:-8.42912,query:'Arco de Almedina, Coimbra, Portugal',photoQuery:'Arco de Almedina Coimbra medieval street',clue:'A medieval gateway beginning the steep old-city climb.',type:'OLD CITY'},
      {name:'Old Cathedral',short:'Sé Velha',lat:40.20936,lon:-8.42655,query:'Sé Velha de Coimbra, Portugal',photoQuery:'Old Cathedral Coimbra Romanesque facade',clue:'A squat Romanesque cathedral like a stone fortress.',type:'HISTORY'},
      {name:'University of Coimbra',short:'University',lat:40.20793,lon:-8.42549,query:'Paço das Escolas Universidade de Coimbra, Portugal',photoQuery:'University of Coimbra Paço das Escolas courtyard',clue:'Grand hilltop courtyard, clock tower and huge valley view.',type:'EPIC'},
      {name:'Joanina Library Exterior',short:'Joanina Library',lat:40.20764,lon:-8.42516,query:'Biblioteca Joanina, Coimbra, Portugal',photoQuery:'Biblioteca Joanina Coimbra exterior university',clue:'Baroque portal inside the university complex.',type:'LANDMARK'},
      {name:'Coimbra Botanical Garden',short:'Botanical Garden',lat:40.20571,lon:-8.4215,query:'Jardim Botânico da Universidade de Coimbra, Portugal',photoQuery:'Coimbra Botanical Garden bamboo avenue',clue:'Deep shade, giant trees and a long bamboo avenue.',type:'QUIET'},
      {name:'Penedo da Saudade',short:'Penedo da Saudade',lat:40.204,lon:-8.41356,query:'Penedo da Saudade, Coimbra, Portugal',photoQuery:'Penedo da Saudade Coimbra viewpoint garden',clue:'Poetic stone terraces overlooking the eastern city.',type:'VIEW'},
      {name:'Parque Verde do Mondego',short:'Mondego park',lat:40.20133,lon:-8.42904,query:'Parque Verde do Mondego, Coimbra, Portugal',photoQuery:'Parque Verde Mondego Coimbra river',clue:'Flat green riverbank beneath the university hill.',type:'RIVER'},
      {name:'Pedro e Inês Footbridge',short:'Pedro e Inês bridge',lat:40.19963,lon:-8.42964,query:'Ponte Pedro e Inês, Coimbra, Portugal',photoQuery:'Ponte Pedro e Inês Coimbra colourful bridge',clue:'A colourful angled footbridge across the Mondego.',type:'DESIGN'},
      {name:'Santa Clara-a-Velha',short:'Santa Clara ruins',lat:40.19898,lon:-8.43343,query:'Mosteiro de Santa Clara-a-Velha, Coimbra, Portugal',photoQuery:'Santa Clara a Velha Coimbra ruins',clue:'Low monastery ruins beside the river plain.',type:'RUINS'},
      {name:'Santa Clara-a-Nova View',short:'Santa Clara-a-Nova',lat:40.20297,lon:-8.4386,query:'Mosteiro de Santa Clara-a-Nova, Coimbra, Portugal',photoQuery:'Santa Clara a Nova Coimbra city view',clue:'Hilltop monastery looking back across all of Coimbra.',type:'VIEW'},
      {name:'Coimbra-B Return',short:'Coimbra-B return',lat:40.22544,lon:-8.44087,query:'Coimbra-B, Portugal',photoQuery:'Coimbra B station Portugal train',clue:'Use live transit back to the mainline station.',type:'FINISH',legMode:'transit'}
    ]
  },
  {
    id:'tomar-templar', city:'Tomar', world:'Templar Realm', title:'Tomar & Convent of Christ',
    subtitle:'A river town, hidden forest and one enormous fortress-monastery.', vibe:'MEDIEVAL QUEST', icon:'⚔️',
    coverQuery:'Convent of Christ Tomar Portugal castle panorama',
    duration:[4,6], steps:[12000,19000], km:11.2, best:['morning','day'], moods:['mindblown','peaceful','trip','long'],
    climate:['city','forest','hills'], dayOnly:true, nightSafe:false, difficulty:'MEDIUM',
    description:'One of the strongest day-trip payoffs from Lisbon: calm streets beneath a monumental Templar complex.',
    transport:{startQuery:'Estação de Tomar, Portugal',startHint:'train to Tomar',endQuery:'Estação de Tomar, Portugal',note:'Check return trains before climbing to the convent. The fortress interior deserves substantial time.',officialUrl:'https://www.cp.pt/'},
    stops:[
      {name:'Tomar Station',short:'Tomar station',lat:39.5999,lon:-8.40948,query:'Estação de Tomar, Portugal',photoQuery:'Tomar railway station Portugal',clue:'Small station a short walk from the old centre.',type:'START'},
      {name:'Mouchão Park',short:'Mouchão',lat:39.60067,lon:-8.41223,query:'Parque do Mouchão, Tomar, Portugal',photoQuery:'Mouchão Park Tomar waterwheel river',clue:'A green island park with a huge wooden waterwheel.',type:'QUIET'},
      {name:'Praça da República',short:'Republic square',lat:39.60362,lon:-8.41543,query:'Praça da República, Tomar, Portugal',photoQuery:'Praça da República Tomar church statue',clue:'Black-and-white paving beneath the castle hill.',type:'SQUARE'},
      {name:'Synagogue of Tomar',short:'Synagogue',lat:39.60419,lon:-8.41364,query:'Sinagoga de Tomar, Portugal',photoQuery:'Synagogue Tomar interior columns',clue:'A small medieval interior of columns and quiet history.',type:'HISTORY'},
      {name:'Mata Nacional dos Sete Montes',short:'Seven Hills forest',lat:39.60466,lon:-8.41902,query:'Mata Nacional dos Sete Montes, Tomar, Portugal',photoQuery:'Mata Sete Montes Tomar forest path',clue:'A walled forest path climbing beneath the fortress.',type:'FOREST'},
      {name:'Convent of Christ',short:'Convent of Christ',lat:39.60398,lon:-8.41958,query:'Convento de Cristo, Tomar, Portugal',photoQuery:'Convent of Christ Tomar Charola castle',clue:'A vast Templar castle and monastery crowning the hill.',type:'EPIC'},
      {name:'Nabão Riverside',short:'Nabão river',lat:39.60322,lon:-8.41087,query:'Rio Nabão Tomar Portugal',photoQuery:'Nabão river Tomar old town',clue:'Calm river reflections beneath the old streets.',type:'RIVER'},
      {name:'Tomar Station Return',short:'Station return',lat:39.5999,lon:-8.40948,query:'Estação de Tomar, Portugal',photoQuery:'Tomar Portugal train station',clue:'Return for the Lisbon train.',type:'FINISH'}
    ]
  },
  {
    id:'obidos-medieval', city:'Óbidos', world:'Walled Storybook', title:'Óbidos Wall Walk',
    subtitle:'White lanes, blue trim and a complete medieval skyline.', vibe:'STORYBOOK TOWN', icon:'🛡️',
    coverQuery:'Óbidos Portugal castle walls white town',
    duration:[3,4.5], steps:[9000,15000], km:8.1, best:['morning','day','sunset'], moods:['mindblown','peaceful','trip'],
    climate:['exposed','town','walls'], dayOnly:true, nightSafe:false, difficulty:'MEDIUM',
    description:'Compact but intensely different from England: a whole whitewashed town held inside medieval walls.',
    transport:{startQuery:'Óbidos Porta da Vila, Portugal',startHint:'live bus route to Óbidos',endQuery:'Óbidos Porta da Vila, Portugal',note:'The wall has unguarded drops and uneven stone. Skip the top walk if windy, wet, crowded or uncomfortable.',officialUrl:'https://rede-expressos.pt/'},
    stops:[
      {name:'Porta da Vila',short:'Porta da Vila',lat:39.35913,lon:-9.15742,query:'Porta da Vila, Óbidos, Portugal',photoQuery:'Porta da Vila Óbidos azulejo chapel',clue:'A tiled chapel hidden inside the main town gate.',type:'START'},
      {name:'Rua Direita',short:'Rua Direita',lat:39.36064,lon:-9.15736,query:'Rua Direita, Óbidos, Portugal',photoQuery:'Rua Direita Óbidos white blue houses',clue:'A narrow whitewashed lane with blue and yellow trim.',type:'STREET'},
      {name:'Igreja de Santa Maria',short:'Santa Maria',lat:39.36202,lon:-9.15716,query:'Igreja de Santa Maria, Óbidos, Portugal',photoQuery:'Santa Maria Church Óbidos square',clue:'A quiet stone square and tiled church interior.',type:'HISTORY'},
      {name:'Óbidos Castle',short:'Óbidos Castle',lat:39.36343,lon:-9.15702,query:'Castelo de Óbidos, Portugal',photoQuery:'Óbidos Castle Portugal towers',clue:'Crenellated towers at the far end of the walled town.',type:'EPIC'},
      {name:'Wall Panorama',short:'Town walls',lat:39.36205,lon:-9.15583,query:'Muralha de Óbidos, Portugal',photoQuery:'Óbidos wall walk panorama town',clue:'A high stone line overlooking every tiled roof.',type:'VIEW'},
      {name:'Aqueduct of Óbidos',short:'Aqueduct',lat:39.35783,lon:-9.15883,query:'Aqueduto de Óbidos, Portugal',photoQuery:'Óbidos aqueduct Portugal',clue:'A long stone aqueduct outside the southern wall.',type:'HISTORY'},
      {name:'Porta da Vila Return',short:'Town gate return',lat:39.35913,lon:-9.15742,query:'Porta da Vila, Óbidos, Portugal',photoQuery:'Óbidos gate evening',clue:'Return to the transport side of town.',type:'FINISH'}
    ]
  },
  {
    id:'ericeira-atlantic-village', city:'Ericeira', world:'Surf-Cliff Village', title:'Ericeira Coastal Wander',
    subtitle:'White-and-blue lanes, surf cliffs and Atlantic sunset.', vibe:'COASTAL ESCAPE', icon:'🌬️',
    coverQuery:'Ericeira Portugal old town Atlantic coast',
    duration:[3.5,5.5], steps:[13000,22000], km:13.7, best:['day','sunset'], moods:['peaceful','cool','long','trip'],
    climate:['coast','breeze','exposed'], dayOnly:false, nightSafe:false, difficulty:'LONG',
    description:'A relaxed seaside world with enough coast to walk for hours, but less urban intensity than Cascais.',
    transport:{startQuery:'Terminal Rodoviário da Ericeira, Portugal',startHint:'live bus to Ericeira terminal',endQuery:'Praia de Ribeira d’Ilhas, Ericeira, Portugal',note:'Use live public transport for both directions and check the last return before committing to the northern coastal extension.'},
    stops:[
      {name:'Ericeira Bus Terminal',short:'Ericeira terminal',lat:38.96602,lon:-9.41499,query:'Terminal Rodoviário da Ericeira, Portugal',photoQuery:'Ericeira Portugal bus terminal town',clue:'Arrive just above the compact old village.',type:'START'},
      {name:'Praça da República',short:'Old town square',lat:38.96298,lon:-9.41637,query:'Praça da República, Ericeira, Portugal',photoQuery:'Ericeira old town square Portugal',clue:'White-and-blue buildings around a leafy village square.',type:'TOWN'},
      {name:'Praia dos Pescadores',short:'Fishermen beach',lat:38.96358,lon:-9.41902,query:'Praia dos Pescadores, Ericeira, Portugal',photoQuery:'Praia Pescadores Ericeira fishing boats',clue:'Fishing boats sheltered beneath the old town.',type:'SEA'},
      {name:'Miradouro da Baleia',short:'Baleia viewpoint',lat:38.95969,lon:-9.41916,query:'Miradouro da Baleia, Ericeira, Portugal',photoQuery:'Miradouro Baleia Ericeira coast',clue:'A cliff terrace facing long Atlantic lines.',type:'VIEW'},
      {name:'Praia do Sul',short:'Praia do Sul',lat:38.95639,lon:-9.41749,query:'Praia do Sul, Ericeira, Portugal',photoQuery:'Praia do Sul Ericeira sunset',clue:'A broad southern bay backed by white houses.',type:'SEA'},
      {name:'São Sebastião Cliffs',short:'São Sebastião',lat:38.97207,lon:-9.41989,query:'Praia de São Sebastião, Ericeira, Portugal',photoQuery:'São Sebastião Ericeira cliffs',clue:'Layered cliffs and reef shelves north of town.',type:'COAST'},
      {name:'Matadouro Boardwalk',short:'Matadouro',lat:38.97756,lon:-9.42018,query:'Praia do Matadouro, Ericeira, Portugal',photoQuery:'Matadouro Ericeira boardwalk surf',clue:'Wooden coastal paths above a famous surf break.',type:'WALK'},
      {name:'Ribeira d’Ilhas',short:'Ribeira d’Ilhas',lat:38.98797,lon:-9.41931,query:'Praia de Ribeira d’Ilhas, Ericeira, Portugal',photoQuery:'Ribeira d Ilhas Ericeira cliffs surf',clue:'A vast amphitheatre of cliffs around the final bay.',type:'FINISH'}
    ]
  }
);
