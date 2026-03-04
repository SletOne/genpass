/**
 * GenPass — Données statiques
 *
 * Ce fichier centralise les données de configuration et la wordlist.
 * Séparé de script.js pour faciliter la maintenance : ajouter des mots,
 * modifier les jeux de caractères ou ajuster la config sans toucher à la logique.
 *
 * Doit être inclus AVANT script.js dans index.html.
 */

/* ===== Configuration des jeux de caractères ===== */

/**
 * Jeux de caractères disponibles pour la génération aléatoire.
 * Exposé globalement (window scope) pour être consommé par script.js.
 */
const CONFIG = {
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    numbers:   '0123456789',
    symbols:   '!@#$%^&*()_+-=[]{}|;:,.<>?'
};

/* ===== Wordlist pour le mode mémorable ===== */

/**
 * Liste de ~511 mots français courts et mémorables.
 *
 * Critères de sélection :
 *   – Sans accents (compatibilité ASCII, aisance de saisie sur toutes dispositions)
 *   – Longueur ≤ 10 caractères
 *   – Connus, évocateurs, faciles à visualiser mentalement
 *
 * Entropie avec 3 mots + 1 chiffre par mot (défaut) :
 *   500³ × 10³ ≈ 1,25 × 10¹¹ combinaisons → ~37 bits
 *   (vs ~28 bits avec la liste de 64 mots précédente)
 *
 * Exposé globalement pour être consommé par script.js.
 */
const WORDS_FR = [

    /* ------------------------------------------------------------------ */
    /* Nature & Paysages (125 mots)                                        */
    /* ------------------------------------------------------------------ */
    'Abime',     'Arbre',     'Ardoise',   'Atoll',     'Aurore',
    'Avalanche', 'Azur',      'Balcon',    'Banquise',  'Basalte',
    'Bassin',    'Bayou',     'Blizzard',  'Boreal',    'Bosquet',
    'Braise',    'Brousse',   'Brume',     'Buisson',   'Butte',
    'Caillou',   'Canyon',    'Cascade',   'Caverne',   'Chemin',
    'Ciel',      'Cime',      'Cirque',    'Citron',    'Clairiere',
    'Colline',   'Coral',     'Cristal',   'Cumulus',   'Cyclone',
    'Desert',    'Dune',      'Eboulis',   'Eclair',    'Estuaire',
    'Etang',     'Etoile',    'Falaise',   'Faille',    'Feuille',
    'Fjord',     'Fleuve',    'Foret',     'Fraise',    'Garrigue',
    'Geyser',    'Glacier',   'Gorge',     'Gouffre',   'Granit',
    'Greve',     'Grotte',    'Herbe',     'Horizon',   'Ile',
    'Ilot',      'Jardin',    'Jungle',    'Karst',     'Kayak',
    'Lac',       'Lagon',     'Lagune',    'Lande',     'Lave',
    'Limon',     'Lune',      'Maquis',    'Marais',    'Marbre',
    'Mesa',      'Mistral',   'Moisson',   'Montagne',  'Moraine',
    'Morne',     'Mousse',    'Mousson',   'Nappe',     'Nebule',
    'Nuage',     'Oasis',     'Ocean',     'Opale',     'Orage',
    'Oued',      'Pampa',     'Paturage',  'Perle',     'Phare',
    'Pierre',    'Plaine',    'Prairie',   'Pluie',     'Puy',
    'Quartz',    'Ravin',     'Recif',     'Rivage',    'Riviere',
    'Roche',     'Ruisseau',  'Sable',     'Sapin',     'Savane',
    'Schiste',   'Sillon',    'Soleil',    'Sommet',    'Steppe',
    'Talus',     'Tempete',   'Terrasse',  'Tornade',   'Torrent',
    'Toundra',   'Vague',     'Vallee',    'Vallon',    'Verglas',
    'Versant',   'Volcan',    'Voute',

    /* ------------------------------------------------------------------ */
    /* Animaux (125 mots)                                                  */
    /* ------------------------------------------------------------------ */
    'Aigle',     'Aigrette',  'Albatros',  'Alcyon',    'Alouette',
    'Antilope',  'Ara',       'Autruche',  'Baleine',   'Belette',
    'Biche',     'Bison',     'Bongo',     'Bouquetin', 'Buffle',
    'Butor',     'Caille',    'Calao',     'Canard',    'Capybara',
    'Caracal',   'Castor',    'Casuar',    'Cerf',      'Chacal',
    'Chamois',   'Cigogne',   'Civette',   'Coati',     'Cobra',
    'Condor',    'Corbeau',   'Couguar',   'Coyote',    'Dindon',
    'Dingo',     'Ecureuil',  'Emeu',      'Faucon',    'Fennec',
    'Flamant',   'Fouine',    'Furet',     'Galago',    'Gavial',
    'Gazelle',   'Geai',      'Gecko',     'Genette',   'Glouton',
    'Gorille',   'Grebe',     'Grizzly',   'Grue',      'Guepard',
    'Harfang',   'Hermine',   'Heron',     'Hibou',     'Huard',
    'Husky',     'Ibis',      'Ibex',      'Iguane',    'Impala',
    'Jaguar',    'Kinkajou',  'Koala',     'Lamantin',  'Lapin',
    'Lemur',     'Leopard',   'Loutre',    'Loup',      'Lynx',
    'Macaque',   'Manchot',   'Mandrill',  'Marmot',    'Marsouin',
    'Merle',     'Merou',     'Milan',     'Mouflon',   'Musaraigne',
    'Nandou',    'Narval',    'Nautile',   'Ocelot',    'Okapi',
    'Opossum',   'Orca',      'Orignal',   'Ours',      'Panda',
    'Panthere',  'Paon',      'Pingouin',  'Piranha',   'Poulain',
    'Puma',      'Putois',    'Raton',     'Raven',     'Renard',
    'Salamandre','Sanglier',  'Saumon',    'Scorpion',  'Serpent',
    'Spatule',   'Suricate',  'Tamarin',   'Tapir',     'Tatou',
    'Tetras',    'Tigre',     'Toucan',    'Varan',     'Vautour',
    'Vervet',    'Wapiti',    'Yak',       'Zebre',     'Zorille',

    /* ------------------------------------------------------------------ */
    /* Objets & Technologie (78 mots)                                      */
    /* ------------------------------------------------------------------ */
    'Ancre',     'Armure',    'Atlas',     'Axe',       'Balise',
    'Barre',     'Baton',     'Boussole',  'Burin',     'Cable',
    'Cadran',    'Capteur',   'Carte',     'Chaine',    'Circuit',
    'Clavier',   'Clef',      'Codex',     'Compas',    'Corde',
    'Crayon',    'Cube',      'Curseur',   'Dague',     'Dalle',
    'Digit',     'Disque',    'Drone',     'Filtre',    'Flux',
    'Forge',     'Graphe',    'Grille',    'Jauge',     'Jeton',
    'Laser',     'Lentille',  'Levier',    'Matrice',   'Mire',
    'Nexus',     'Noyau',     'Octet',     'Orbite',    'Pixel',
    'Pivot',     'Radar',     'Rayon',     'Relais',    'Reseau',
    'Signal',    'Sonde',     'Spectre',   'Tamis',     'Toile',
    'Turbine',   'Vecteur',   'Vortex',    'Aimant',    'Arche',
    'Arceau',    'Bascule',   'Cabestan',  'Crochet',   'Enclume',
    'Fuseau',    'Gabarit',   'Gouvernail','Hamecon',   'Mandrin',
    'Moufle',    'Passerelle','Piston',    'Poulie',    'Ressort',
    'Rivet',     'Treillis',  'Treuil',

    /* ------------------------------------------------------------------ */
    /* Sciences & Nature abstraite (70 mots)                               */
    /* ------------------------------------------------------------------ */
    'Apex',      'Axone',     'Base',      'Beta',      'Biome',
    'Brin',      'Chrome',    'Cible',     'Codon',     'Comet',
    'Cortex',    'Delta',     'Ellipse',   'Enzyme',    'Ether',
    'Fibre',     'Focus',     'Gene',      'Globe',     'Gradient',
    'Helix',     'Ion',       'Isotope',   'Locus',     'Magma',
    'Molecule',  'Neurone',   'Onde',      'Phase',     'Photon',
    'Planet',    'Plasma',    'Pole',      'Proton',    'Quasar',
    'Secteur',   'Serum',     'Sinus',     'Spore',     'Synapse',
    'Tenseur',   'Voxel',     'Zenith',    'Zephyr',    'Zone',
    'Zygote',    'Genome',    'Allele',    'Gamete',    'Flagelle',
    'Mitose',    'Dendrite',  'Bactum',    'Electron',  'Photino',
    'Boson',     'Fermion',   'Tachyon',   'Muon',      'Quark',
    'Gluon',     'Lepton',    'Meson',     'Baryon',    'Hadron',
    'Nebula',    'Pulsar',    'Supernova', 'Redshift',  'Parsec',

    /* ------------------------------------------------------------------ */
    /* Concepts & Quotidien (110 mots)                                     */
    /* ------------------------------------------------------------------ */
    'Abri',      'Acier',     'Aile',      'Angle',     'Anneau',
    'Arc',       'Art',       'Assaut',    'Aura',      'Bague',
    'Bande',     'Bastion',   'Bilan',     'Bord',      'Borne',
    'Brise',     'Cage',      'Calme',     'Cap',       'Cave',
    'Chasse',    'Choc',      'Chute',     'Clan',      'Coin',
    'Col',       'Cone',      'Coupe',     'Cycle',     'Debut',
    'Degre',     'Defi',      'Dome',      'Donjon',    'Ecran',
    'Elan',      'Epee',      'Etat',      'Exploit',   'Face',
    'Feu',       'Fil',       'Flot',      'Force',     'Fort',
    'Foudre',    'Garde',     'Geste',     'Graal',     'Guide',
    'Halo',      'Hameau',    'Jeu',       'Lame',      'Lance',
    'Legende',   'Lien',      'Lion',      'Logis',     'Main',
    'Masse',     'Menhir',    'Metal',     'Mode',      'Monde',
    'Mur',       'Mythe',     'Nid',       'Noeud',     'Nuit',
    'Oracle',    'Ordre',     'Outil',     'Pacte',     'Pari',
    'Piste',     'Plan',      'Pont',      'Prisme',    'Prise',
    'Race',      'Rang',      'Recul',     'Refuge',    'Regle',
    'Rempart',   'Role',      'Rond',      'Route',     'Rubis',
    'Rythme',    'Saphir',    'Sens',      'Sentier',   'Seuil',
    'Site',      'Source',    'Sport',     'Style',     'Table',
    'Titre',     'Trace',     'Tube',      'Unite',     'Valeur',
    'Vestige',   'Vide',      'Vie',       'Voie',      'Vue'

];
