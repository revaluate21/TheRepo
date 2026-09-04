'use strict';

window.WANDER_DATA = {
  version: '2.0.0',
  home: { name: '2660-213 Santo António dos Cavaleiros', lat: 38.81087, lon: -9.16087 },
  routes: [
    {
      id: 'lisbon-seven-hills', city: 'Lisbon', title: 'Seven Hills',
      subtitle: 'The full classic Lisbon experience', vibe: 'OLD CITY · VIEWS', icon: '☀️',
      cover: '../assets/photos/parque.jpg', duration: [5, 7], steps: [19000, 28000], travelMin: 45,
      times: ['morning','day','sunset'], moods: ['epic','long','classic'], climate: ['city','hills','views','exposed'],
      dayOnly: false, nightSafe: false, book: '',
      transport: 'Public transport to Parque Eduardo VII. Finish by Cais do Sodré.',
      startQuery: 'Parque Eduardo VII, Lisboa, Portugal',
      stops: [
        ['Parque Eduardo VII',38.7289,-9.1525,'../assets/photos/parque.jpg','Start high. Look down the long green avenue.'],
        ['São Pedro de Alcântara',38.7154,-9.1442,'../assets/photos/sao-pedro.jpg','Castle-facing terrace over Baixa.'],
        ['Carmo ruins',38.7121,-9.1403,'../assets/photos/carmo.jpg','Roofless Gothic arches.'],
        ['Rossio',38.7139,-9.1394,'../assets/photos/rossio.jpg','Wave pavement and fountains.'],
        ['Senhora do Monte',38.7190,-9.1327,'../assets/photos/senhora.jpg','The widest hilltop panorama.'],
        ['Graça viewpoint',38.7163,-9.1315,'../assets/photos/graca.jpg','Terrace, church and rooftops.'],
        ['Santa Luzia',38.7118,-9.1304,'../assets/photos/santa-luzia.jpg','Blue tiles, pergola, Alfama.'],
        ['Lisbon Cathedral',38.7098,-9.1331,'../assets/photos/se.jpg','Twin fortress-like towers.'],
        ['Praça do Comércio',38.7077,-9.1365,'../assets/photos/praca.jpg','Huge yellow square meeting the Tagus.'],
        ['Cais do Sodré',38.7058,-9.1459,'../assets/photos/cais.jpg','River finish and transport hub.']
      ]
    },
    {
      id: 'lisbon-sunset-river', city: 'Lisbon', title: 'Sunset to River',
      subtitle: 'Views, tiled streets and a breezy finish', vibe: 'GOLDEN HOUR', icon: '🌇',
      cover: '../assets/photos/sao-pedro.jpg', duration: [3, 4.5], steps: [12000, 18000], travelMin: 45,
      times: ['sunset','night'], moods: ['epic','peaceful','night'], climate: ['city','views','river','breeze'],
      dayOnly: false, nightSafe: true, book: '', transport: 'Start at São Pedro de Alcântara. Finish at Cais do Sodré.',
      startQuery: 'Miradouro de São Pedro de Alcântara, Lisboa, Portugal',
      stops: [
        ['São Pedro de Alcântara',38.7154,-9.1442,'../assets/photos/sao-pedro.jpg','Watch the city change colour.'],
        ['Carmo ruins',38.7121,-9.1403,'../assets/photos/carmo.jpg','Gothic arches at dusk.'],
        ['Rossio',38.7139,-9.1394,'../assets/photos/rossio.jpg','Bright centre and patterned stone.'],
        ['Bica',38.7100,-9.1466,'../assets/photos/bica.jpg','Steep rails and stacked balconies.'],
        ['Pink Street',38.7075,-9.1437,'../assets/photos/pink.jpg','Fast neon-colour detour.'],
        ['Ribeira das Naus',38.7068,-9.1417,'../assets/photos/cais.jpg','Flat water-side cooldown.'],
        ['Praça do Comércio',38.7077,-9.1365,'../assets/photos/praca.jpg','Open river skyline.'],
        ['Cais do Sodré',38.7058,-9.1459,'../assets/photos/cais.jpg','Finish with transport nearby.']
      ]
    },
    {
      id: 'lisbon-after-dark', city: 'Lisbon', title: 'After Dark',
      subtitle: 'Lit landmarks, city energy, no lonely hill trails', vibe: 'NIGHT CITY', icon: '🌙',
      cover: '../assets/photos/pink.jpg', duration: [2.5, 4], steps: [9000, 16000], travelMin: 45,
      times: ['night'], moods: ['night','classic'], climate: ['city','river','lit'],
      dayOnly: false, nightSafe: true, book: '', transport: 'Start at Rossio. Stay on lit central streets and finish at Cais do Sodré.',
      startQuery: 'Rossio, Lisboa, Portugal',
      stops: [
        ['Rossio',38.7139,-9.1394,'../assets/photos/rossio.jpg','The bright central launch point.'],
        ['Carmo ruins',38.7121,-9.1403,'../assets/photos/carmo.jpg','Atmospheric exterior.'],
        ['São Pedro de Alcântara',38.7154,-9.1442,'../assets/photos/sao-pedro.jpg','Night skyline from a busy viewpoint.'],
        ['Bica',38.7100,-9.1466,'../assets/photos/bica.jpg','Rails, lamps and balconies.'],
        ['Pink Street',38.7075,-9.1437,'../assets/photos/pink.jpg','Nightlife colour, easy in and out.'],
        ['Praça do Comércio',38.7077,-9.1365,'../assets/photos/praca.jpg','The river-facing square after dark.'],
        ['Cais do Sodré',38.7058,-9.1459,'../assets/photos/cais.jpg','Transport decision point.']
      ]
    },
    {
      id: 'belem-river', city: 'Lisbon', title: 'Belém River Arc',
      subtitle: 'Monuments, modern curves and open sky', vibe: 'RIVER · ARCHITECTURE', icon: '⛵',
      cover: '../assets/photos/belem.jpg', duration: [3.5, 5], steps: [13000, 20000], travelMin: 60,
      times: ['morning','day','sunset','night'], moods: ['peaceful','cool','classic'], climate: ['river','breeze','flat','exposed'],
      dayOnly: false, nightSafe: true, book: '', transport: 'Train or tram toward Belém. Mostly flat river walking.',
      startQuery: 'Mosteiro dos Jerónimos, Lisboa, Portugal',
      stops: [
        ['Jerónimos Monastery',38.6979,-9.2066,'../assets/photos/belem.jpg','Long carved limestone façade.'],
        ['Belém waterfront',38.6940,-9.2058,'../assets/photos/belem.jpg','Open river and monument axis.'],
        ['Belém Tower',38.6916,-9.2160,'../assets/photos/belem.jpg','Stone tower sitting in the Tagus.'],
        ['MAAT',38.6959,-9.1946,'../assets/photos/maat.jpg','Walkable white wave roof.'],
        ['LX Factory',38.7038,-9.1785,'../assets/photos/maat.jpg','Industrial courtyards and murals.']
      ]
    },
    {
      id: 'parque-nacoes', city: 'Lisbon', title: 'Future Waterfront',
      subtitle: 'Open space, steel, glass and night reflections', vibe: 'FUTURE CITY', icon: '🌌',
      cover: '../assets/photos/oriente.jpg', duration: [2.5, 4], steps: [9000, 15000], travelMin: 35,
      times: ['morning','day','sunset','night'], moods: ['peaceful','cool','night'], climate: ['river','breeze','flat','modern','lit'],
      dayOnly: false, nightSafe: true, book: '', transport: 'Metro or train to Oriente. Flat and very easy to shorten.',
      startQuery: 'Gare do Oriente, Lisboa, Portugal',
      stops: [
        ['Gare do Oriente',38.7678,-9.0991,'../assets/photos/oriente.jpg','Calatrava canopy and huge station space.'],
        ['Vasco da Gama waterfront',38.7661,-9.0951,'../assets/photos/oriente.jpg','Glass, water and long sightlines.'],
        ['Oceanarium promenade',38.7636,-9.0936,'../assets/photos/oriente.jpg','Quiet water edge and cable cars.'],
        ['Jardins da Água',38.7594,-9.0960,'../assets/photos/oriente.jpg','Water gardens and broad paths.'],
        ['Vasco da Gama Tower',38.7749,-9.0925,'../assets/photos/oriente.jpg','Tall riverside needle at the north end.']
      ]
    },
    {
      id: 'almada-skyline', city: 'Almada', title: 'Cacilhas Skyline',
      subtitle: 'Ferry, cliff paths and Lisbon across the water', vibe: 'SUNSET · SKYLINE', icon: '⛴️',
      cover: '../assets/photos/cristo.jpg', duration: [3, 5], steps: [12000, 19000], travelMin: 65,
      times: ['morning','day','sunset'], moods: ['mindblown','peaceful','cool'], climate: ['river','breeze','views','hills'],
      dayOnly: false, nightSafe: false, book: '', transport: 'Ferry to Cacilhas, then walk uphill toward Cristo Rei. Check return ferry live.',
      startQuery: 'Terminal Fluvial de Cacilhas, Almada, Portugal',
      stops: [
        ['Cacilhas ferry terminal',38.6861,-9.1486,'../assets/photos/boca-vento.jpg','Lisbon skyline immediately across the water.'],
        ['Ginjal riverfront',38.6847,-9.1531,'../assets/photos/boca-vento.jpg','Old riverside buildings beneath the cliff.'],
        ['Boca do Vento',38.6834,-9.1587,'../assets/photos/boca-vento.jpg','Elevator viewpoint over bridge and river.'],
        ['Casa da Cerca',38.6836,-9.1602,'../assets/photos/boca-vento.jpg','Garden balcony above Lisbon.'],
        ['Cristo Rei',38.6786,-9.1714,'../assets/photos/cristo.jpg','Monument, bridge and enormous panorama.']
      ]
    },
    {
      id: 'lisbon-river-lights', city: 'Lisbon', title: 'River Lights',
      subtitle: 'A short late-night loop with the Tagus always nearby', vibe: 'EASY NIGHT', icon: '✨',
      cover: '../assets/photos/praca.jpg', duration: [1.5, 3], steps: [6000, 12000], travelMin: 50,
      times: ['sunset','night'], moods: ['night','peaceful','cool'], climate: ['city','river','breeze','lit','flat'],
      dayOnly: false, nightSafe: true, book: '', transport: 'Start at Praça do Comércio and finish at Cais do Sodré. Easy to abandon early.',
      startQuery: 'Praça do Comércio, Lisboa, Portugal',
      stops: [
        ['Praça do Comércio',38.7077,-9.1365,'../assets/photos/praca.jpg','Open square, arch and river.'],
        ['Ribeira das Naus',38.7068,-9.1417,'../assets/photos/cais.jpg','Sit or stroll beside the Tagus.'],
        ['Pink Street',38.7075,-9.1437,'../assets/photos/pink.jpg','Quick colour and city energy.'],
        ['Cais do Sodré',38.7058,-9.1459,'../assets/photos/cais.jpg','Finish beside transport.']
      ]
    },
    {
      id: 'lisbon-baixa-chiado', city: 'Lisbon', title: 'Baixa & Chiado Lights',
      subtitle: 'Central architecture without the remote hill wandering', vibe: 'CENTRAL NIGHT', icon: '💡',
      cover: '../assets/photos/carmo.jpg', duration: [2, 3.5], steps: [8000, 14000], travelMin: 45,
      times: ['sunset','night'], moods: ['night','classic'], climate: ['city','lit','river'],
      dayOnly: false, nightSafe: true, book: '', transport: 'Start at Rossio, stay central and finish beside the river.',
      startQuery: 'Rossio, Lisboa, Portugal',
      stops: [
        ['Rossio',38.7139,-9.1394,'../assets/photos/rossio.jpg','Bright square and wave pavement.'],
        ['Carmo ruins',38.7121,-9.1403,'../assets/photos/carmo.jpg','Roofless Gothic silhouette.'],
        ['São Pedro de Alcântara',38.7154,-9.1442,'../assets/photos/sao-pedro.jpg','Night skyline from a busy terrace.'],
        ['Bica',38.7100,-9.1466,'../assets/photos/bica.jpg','Steep tram rails and balconies.'],
        ['Praça do Comércio',38.7077,-9.1365,'../assets/photos/praca.jpg','Big open finish before the river.'],
        ['Cais do Sodré',38.7058,-9.1459,'../assets/photos/cais.jpg','Transport hub.']
      ]
    },
    {
      id: 'sintra-peaks', city: 'Sintra', title: 'Palaces & Peaks',
      subtitle: 'Fantasy architecture and serious climbing', vibe: 'FAIRY TALE', icon: '🏰',
      cover: '../assets/photos/pena.jpg', duration: [6, 8], steps: [17000, 27000], travelMin: 75,
      times: ['morning','day'], moods: ['mindblown','long','trip'], climate: ['forest','shade','hills','views'],
      dayOnly: true, nightSafe: false, book: 'https://www.parquesdesintra.pt/en/', transport: 'Train to Sintra. Start early. Timed monument tickets may be required.',
      startQuery: 'Sintra Train Station, Portugal',
      stops: [
        ['Sintra station',38.7988,-9.3865,'../assets/photos/regaleira.jpg','Start before the crowds build.'],
        ['Sintra old town',38.7974,-9.3907,'../assets/photos/regaleira.jpg','White chimneys beneath green hills.'],
        ['Quinta da Regaleira',38.7960,-9.3965,'../assets/photos/regaleira.jpg','Mystical gardens, towers and wells.'],
        ['Moorish Castle',38.7926,-9.3896,'../assets/photos/mouros.jpg','Stone walls running over the ridge.'],
        ['Pena Palace',38.7876,-9.3906,'../assets/photos/pena.jpg','Bright palace above the forest.']
      ]
    },
    {
      id: 'sintra-monserrate', city: 'Sintra', title: 'Monserrate Dream',
      subtitle: 'The quieter garden-heavy Sintra world', vibe: 'FOREST · GARDENS', icon: '🌿',
      cover: '../assets/photos/monserrate.jpg', duration: [5, 7], steps: [13000, 21000], travelMin: 85,
      times: ['morning','day'], moods: ['peaceful','mindblown','trip'], climate: ['forest','shade','garden','hills'],
      dayOnly: true, nightSafe: false, book: 'https://www.parquesdesintra.pt/en/parks-monuments/park-and-palace-of-monserrate/', transport: 'Train to Sintra, then use live local transport to Monserrate. Do not assume a long road walk is pleasant.',
      startQuery: 'Sintra Train Station, Portugal',
      stops: [
        ['Sintra old town',38.7974,-9.3907,'../assets/photos/regaleira.jpg','A gentle historic beginning.'],
        ['Quinta da Regaleira',38.7960,-9.3965,'../assets/photos/regaleira.jpg','Optional garden world.'],
        ['Seteais viewpoint',38.7966,-9.4040,'../assets/photos/monserrate.jpg','Palace axis and mountain view.'],
        ['Monserrate Palace',38.7938,-9.4206,'../assets/photos/monserrate.jpg','Exotic palace within dense gardens.']
      ]
    },
    {
      id: 'cascais-guincho', city: 'Cascais', title: 'Atlantic Edge',
      subtitle: 'Elegant town, cliffs, dunes and huge ocean air', vibe: 'COAST · BREEZE', icon: '🌊',
      cover: '../assets/photos/guincho.jpg', duration: [5, 7], steps: [17000, 27000], travelMin: 85,
      times: ['morning','day','sunset'], moods: ['mindblown','cool','long','trip'], climate: ['coast','breeze','flat','exposed'],
      dayOnly: false, nightSafe: false, book: '', transport: 'Train from Cais do Sodré to Cascais. The Guincho extension is long; check a bus for the return.',
      startQuery: 'Cascais Train Station, Portugal',
      stops: [
        ['Cascais old town',38.6974,-9.4215,'../assets/photos/boca.jpg','Paved lanes opening toward the sea.'],
        ['Boca do Inferno',38.6927,-9.4306,'../assets/photos/boca.jpg','Atlantic water crashing into dark rock.'],
        ['Casa da Guia',38.6964,-9.4495,'../assets/photos/guincho.jpg','Clifftop sea horizon.'],
        ['Guincho dunes',38.7258,-9.4713,'../assets/photos/guincho.jpg','Wind, dunes and mountain backdrop.'],
        ['Praia do Guincho',38.7321,-9.4728,'../assets/photos/guincho.jpg','Massive open Atlantic finish.']
      ]
    },
    {
      id: 'coimbra-grand', city: 'Coimbra', title: 'University City',
      subtitle: 'Medieval lanes, monumental stairs and the Mondego', vibe: 'ANCIENT · ACADEMIC', icon: '📚',
      cover: '../assets/photos/coimbra.jpg', duration: [6, 8], steps: [17000, 25000], travelMin: 150,
      times: ['morning','day'], moods: ['mindblown','long','trip'], climate: ['city','hills','river','exposed'],
      dayOnly: true, nightSafe: false, book: 'https://www.uc.pt/en/visit/', transport: 'Intercity train. Book the return first and start early.',
      startQuery: 'Coimbra-B Station, Portugal',
      stops: [
        ['Portagem and Mondego',40.2076,-8.4295,'../assets/photos/coimbra.jpg','River, bridge and the university hill.'],
        ['Santa Cruz',40.2110,-8.4295,'../assets/photos/coimbra.jpg','Historic square and monastery façade.'],
        ['Almedina Gate',40.2094,-8.4264,'../assets/photos/coimbra.jpg','Narrow climb into the old city.'],
        ['Old Cathedral',40.2094,-8.4273,'../assets/photos/coimbra.jpg','Romanesque stone fortress-church.'],
        ['University courtyard',40.2079,-8.4260,'../assets/photos/joanina.jpg','Grand hilltop courtyard and city view.'],
        ['Botanical Garden',40.2050,-8.4229,'../assets/photos/coimbra.jpg','Green cooldown below the university.'],
        ['Mondego river walk',40.2059,-8.4306,'../assets/photos/coimbra.jpg','Flat final stretch beside the water.']
      ]
    },
    {
      id: 'obidos-walls', city: 'Óbidos', title: 'Medieval Wall World',
      subtitle: 'White lanes inside a complete walled town', vibe: 'MEDIEVAL', icon: '🛡️',
      cover: '../assets/photos/obidos.jpg', duration: [4, 6], steps: [12000, 19000], travelMin: 110,
      times: ['morning','day','sunset'], moods: ['mindblown','peaceful','trip'], climate: ['town','hills','exposed'],
      dayOnly: true, nightSafe: false, book: '', transport: 'Use live public transport; bus is often more practical than the railway station location.',
      startQuery: 'Porta da Vila, Óbidos, Portugal',
      stops: [
        ['Porta da Vila',39.3584,-9.1570,'../assets/photos/obidos.jpg','Blue-and-white tiled gateway.'],
        ['Rua Direita',39.3601,-9.1568,'../assets/photos/obidos.jpg','White walls, colour and cobbles.'],
        ['Castle',39.3630,-9.1562,'../assets/photos/obidos.jpg','Stone fortress at the far end.'],
        ['Wall viewpoint',39.3619,-9.1580,'../assets/photos/obidos.jpg','Town roofs and countryside.']
      ]
    },
    {
      id: 'tomar-templar', city: 'Tomar', title: 'Templar Fortress',
      subtitle: 'A calm town beneath one of Portugal’s great complexes', vibe: 'TEMPLAR · QUIET', icon: '⚔️',
      cover: '../assets/photos/tomar.jpg', duration: [5, 7], steps: [13000, 21000], travelMin: 125,
      times: ['morning','day'], moods: ['mindblown','peaceful','trip'], climate: ['town','forest','shade','hills'],
      dayOnly: true, nightSafe: false, book: '', transport: 'Train or coach. Check the last return before climbing to the convent.',
      startQuery: 'Tomar Train Station, Portugal',
      stops: [
        ['Tomar station',39.5984,-8.4157,'../assets/photos/tomar.jpg','Easy walk into the centre.'],
        ['Praça da República',39.6030,-8.4143,'../assets/photos/tomar.jpg','Geometric pavement beneath the castle hill.'],
        ['Mata dos Sete Montes',39.6039,-8.4165,'../assets/photos/tomar.jpg','Shaded forest approach.'],
        ['Convent of Christ',39.6046,-8.4183,'../assets/photos/tomar.jpg','Templar walls, cloisters and Manueline detail.']
      ]
    },
    {
      id: 'evora-stone', city: 'Évora', title: 'Roman & Whitewashed',
      subtitle: 'Temple, cathedral roofs and bright Alentejo streets', vibe: 'ROMAN · SUN', icon: '🏛️',
      cover: '../assets/photos/evora.jpg', duration: [5, 7], steps: [14000, 21000], travelMin: 120,
      times: ['morning','day'], moods: ['classic','trip','long'], climate: ['city','exposed','hot','flat'],
      dayOnly: true, nightSafe: false, book: '', transport: 'Train or coach. In hot weather start early and avoid the peak afternoon.',
      startQuery: 'Évora Train Station, Portugal',
      stops: [
        ['Praça do Giraldo',38.5714,-7.9093,'../assets/photos/evora.jpg','Arcades and white façades.'],
        ['Roman Temple',38.5726,-7.9076,'../assets/photos/evora.jpg','Ancient columns in the open city.'],
        ['Évora Cathedral',38.5720,-7.9075,'../assets/photos/evora.jpg','Stone towers and rooftop views.'],
        ['Aqueduct lanes',38.5765,-7.9146,'../assets/photos/evora.jpg','Houses built into Roman arches.'],
        ['Public Garden',38.5667,-7.9103,'../assets/photos/evora.jpg','Shaded finish near the old walls.']
      ]
    }
  ].map(route => ({
    ...route,
    stops: route.stops.map((s, i) => ({
      id: `${route.id}-${i+1}`, name:s[0], lat:s[1], lon:s[2], photo:s[3], clue:s[4]
    }))
  }))
};
