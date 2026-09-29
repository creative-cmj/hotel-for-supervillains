// Character-specific source of truth distilled from assets/villain-roster/prompts.
// Scale values are relative to the normal hotel guest height used by the runtime.
const rows = [
['doctor-drizzle',1.04,.25,.9,'tall','angular','stern','glove',[0x5b91b5,0x303745,0xe8bd4f],'weatherDial',0],
['professor-freezerburn',.86,.33,1.2,'round','square','angry','glove',[0x172b52,0xe47832,0x8ee9f4],'iceScraper',0],
['captain-combustion',1.08,.25,1.4,'athletic','wedge','grin','glove',[0xc9582d,0x581d2c,0xf2e4c5],'extinguisher',0],
['baron-battery',.98,.25,1.1,'barrel','angular','smug','glove',[0x603d88,0x343942,0xb7df45],'batteryCane',0],
['madame-vine',1.07,.2,.8,'elegant','long','sideEye','thin',[0x285538,0x632d67,0xa7d993],'pruningShears',0],
['doctor-buffering',1,.25,.9,'slouch','square','confused','normal',[0x52606d,0x39c9c7,0xf4f1e8],'tablet',0],
['professor-kaboom',.75,.33,1,'tiny','triangle','maniac','glove',[0xf1e9d5,0x4b4748,0xef559f],'detonator',0],
['lord-side-eye',1.16,.25,.7,'skinny','long','sideEye','thin',[0x3f234f,0x16131c,0xbec3cb],'umbrellaCane',0],
['mister-monday',.99,.25,.9,'slouch','oval','sleepy','normal',[0x627b96,0x694838,0xeee2c9],'coffeeCup',0],
['the-landlord',.94,.2,1.3,'blocky','oval','coldSmile','normal',[0x57643d,0x6f2735,0xc99a3e],'brassKey',0],
['sir-sludge',.91,.25,1.2,'slime','droplet','worried','slime',[0x4f7243,0x292d2b,0xb69042],'spoonSword',0],
['count-confusion',1.05,.25,.8,'cape','oval','lost','glove',[0x392b75,0xeee8db,0xdc5f9f],'stageWand',0],
['the-auditor',1,.22,.8,'rigid','long','unimpressed','normal',[0x30343b,0xf1eee7,0xb53842],'ledger',0],
['professor-gravity',.97,.29,.8,'average','pear','smug','normal',[0x3a285e,0xaeb5c2,0x2caeaa],'gravityDial',2],
['dj-doom',1.01,.25,1.3,'broad','square','smug','normal',[0x16151a,0xe348ac,0x3ddde3],'headphones',0],
['sandmaniac',.99,.24,.9,'wrapped','oval','smug','wrapped',[0xb67a38,0x4a3021,0x38a7a5],'sandTimer',0],
['general-glitch',1.03,.2,1.3,'asymmetric','square','stern','mechanical',[0x34383f,0x365ba2,0xe76566],'commandBracer',0],
['mister-midnight',1.09,.25,1,'hooded','long','stern','glove',[0x202a53,0x111216,0xe1c77d],'lantern',0],
['lady-luxury',1.06,.2,.8,'regal','oval','unimpressed','elegant',[0x1f654d,0xe0c191,0x161516],'gemCane',0],
['doctor-oops',.9,.33,.9,'lopsided','round','nervous','normal',[0xa8dfca,0x26345c,0xe68a32],'bentRayGun',0],
['pigeon-king',.92,.2,1.1,'barrel','round','tinyAngry','normal',[0x31558a,0x626d79,0xe4bb47],'pigeon',0],
['chef-catastrophe',1.03,.25,1.4,'round','round','angry','normal',[0xeee5d2,0xb3323e,0x242329],'spatula',0],
['captain-coupon',.89,.33,.8,'skinny','long','grin','normal',[0xc49a37,0x64713c,0xc9474f],'coupon',0],
['uninvited-guest',1,.24,.9,'average','long','nervous','normal',[0xb7aa91,0x2d3856,0xc84a4f],'keycard',0],
['professor-nap',.87,.33,1,'soft','round','sleepy','normal',[0x977ab7,0x6f88a6,0xeee3ca],'pillow',0],
['mister-magnet',.96,.25,1.2,'armored','triangle','smug','normal',[0xa44836,0x34373a,0x527b98],'magnetGauntlet',3],
['doctor-bubble',.93,.27,.9,'bubble','round','happy','normal',[0x77cbb7,0x683c73,0xe9e7dd],'bubbleWand',0],
['king-concrete',1.23,.17,1.6,'rock','block','tinyAngry','stoneFist',[0x777b7d,0xe27630,0x363d43],'permitPlaque',0],
['agent-awkward',1.02,.2,.8,'skinny','long','nervous','normal',[0xb59a72,0x283d62,0xe26767],'earpiece',0],
['final-boss',1.27,.125,1.7,'boss','tiny','unimpressed','giantGlove',[0x17151b,0x672638,0xb38b45],'tinyClipboard',0],
];

export const VILLAIN_PRODUCTION_SPECS = Object.freeze(Object.fromEntries(rows.map(([id,scale,headRatio,shoulderRatio,archetype,headShape,expression,handStyle,colors,signature,intentionalFloatCount])=>[id,Object.freeze({id,scale,headRatio,shoulderRatio,archetype,headShape,expression,handStyle,colors:Object.freeze(colors),signature,intentionalFloatCount})])));
export const NORMAL_GUEST_HEIGHT = 2.05;
