export interface BibleHero {
  name: string;
  deeds: string[];
  era: 'Patriarchs' | 'Judges' | 'Kings' | 'Prophets' | 'Exile' | 'Apostles' | 'Early Church';
}

export const BIBLE_HEROES: BibleHero[] = [
  {
    name: "Adam",
    era: "Patriarchs",
    deeds: [
      "The first man created by God in His image.",
      "The man who named all the living creatures.",
      "The first inhabitant of the Garden of Eden."
    ]
  },
  {
    name: "Eve",
    era: "Patriarchs",
    deeds: [
      "The first woman created by God from Adam's rib.",
      "The woman known as the mother of all living.",
      "The first woman to live in the Garden of Eden."
    ]
  },
  {
    name: "Noah",
    era: "Patriarchs",
    deeds: [
      "Built a massive ark to save his family from the flood.",
      "Released a dove from the ark to find dry land.",
      "Received the rainbow as the sign of God's covenant."
    ]
  },
  {
    name: "Abraham",
    era: "Patriarchs",
    deeds: [
      "Left his home for a land God promised to show him.",
      "The patriarch promised to be father of many nations.",
      "Willing to sacrifice his son Isaac in obedience to God."
    ]
  },
  {
    name: "Sarah",
    era: "Patriarchs",
    deeds: [
      "Gave birth to Isaac in her very old age.",
      "The wife of Abraham who laughed at God's promise."
    ]
  },
  {
    name: "Joseph",
    era: "Patriarchs",
    deeds: [
      "Interpreted Pharaoh's dreams about the famine.",
      "Sold into slavery in Egypt by his own brothers.",
      "Received a coat of many colors from his father."
    ]
  },
  {
    name: "Moses",
    era: "Patriarchs",
    deeds: [
      "Parted the Red Sea for the Israelites to escape Egypt.",
      "Received the Ten Commandments on Mount Sinai.",
      "Spoke to God through a miraculous burning bush."
    ]
  },
  {
    name: "Joshua",
    era: "Judges",
    deeds: [
      "Commanded the sun to stand still during battle.",
      "Led the Israelites in the fall of Jericho's walls.",
      "Led Israel into the Promised Land after Moses."
    ]
  },
  {
    name: "Deborah",
    era: "Judges",
    deeds: [
      "Female judge who held court under a palm tree.",
      "Prophetess who led the army to victory over Sisera."
    ]
  },
  {
    name: "Gideon",
    era: "Judges",
    deeds: [
      "Judge who defeated Midianites with only 300 men.",
      "Asked God for a sign with a fleece of wool."
    ]
  },
  {
    name: "Samson",
    era: "Judges",
    deeds: [
      "Judge blessed with immense strength through his hair.",
      "Defeated the Philistines with a donkey's jawbone.",
      "Pushed over the pillars of the Philistine temple."
    ]
  },
  {
    name: "Ruth",
    era: "Judges",
    deeds: [
      "Remained loyal to her mother-in-law.",
      "Gleaned in the fields of Boaz."
    ]
  },
  {
    name: "Samuel",
    era: "Kings",
    deeds: [
      "Heard God calling him in the temple.",
      "Anointed Saul and David as kings.",
      "Last judge and first major prophet."
    ]
  },
  {
    name: "David",
    era: "Kings",
    deeds: [
      "Shepherd boy who defeated Goliath with a sling.",
      "King of Israel who wrote many of the Psalms.",
      "The man after God's own heart who became king."
    ]
  },
  {
    name: "Solomon",
    era: "Kings",
    deeds: [
      "King who asked God for wisdom to lead his people.",
      "The son of David who built the first Temple.",
      "Wise king who wrote Proverbs and Ecclesiastes."
    ]
  },
  {
    name: "Elijah",
    era: "Prophets",
    deeds: [
      "Prophet who called down fire on Mount Carmel.",
      "Taken to heaven in a whirlwind and chariot of fire.",
      "Prophet who was fed by ravens during a drought."
    ]
  },
  {
    name: "Elisha",
    era: "Prophets",
    deeds: [
      "Asked for double Elijah's spirit.",
      "Healed Naaman the leper.",
      "Made an iron axe head float."
    ]
  },
  {
    name: "Esther",
    era: "Exile",
    deeds: [
      "Queen who risked her life to save her people.",
      "Approached the king unsummoned for her people.",
      "Exposed Haman's evil plan to destroy the Jews."
    ]
  },
  {
    name: "Daniel",
    era: "Exile",
    deeds: [
      "Protected by God in a den of hungry lions.",
      "Refused to eat the king's rich food in Babylon.",
      "Interpreted mysterious writing on the wall."
    ]
  },
  {
    name: "Nehemiah",
    era: "Exile",
    deeds: [
      "Rebuilt Jerusalem's walls in 52 days.",
      "Cupbearer to King Artaxerxes."
    ]
  },
  {
    name: "Peter",
    era: "Apostles",
    deeds: [
      "Apostle who walked on water toward Jesus.",
      "Fisherman who became the 'rock' of the church.",
      "Preached at Pentecost where 3,000 were saved."
    ]
  },
  {
    name: "Paul",
    era: "Apostles",
    deeds: [
      "Miraculously converted on the road to Damascus.",
      "Apostle who wrote many New Testament letters.",
      "Missionary who traveled on three major journeys."
    ]
  },
  {
    name: "Stephen",
    era: "Early Church",
    deeds: [
      "First Christian martyr stoned for his faith.",
      "One of the first seven deacons of the church."
    ]
  },
  {
    name: "Mary",
    era: "Apostles",
    deeds: [
      "Humble woman chosen to be mother of Jesus.",
      "The mother of Jesus who visited Elizabeth."
    ]
  },
  {
    name: "John the Baptist",
    era: "Apostles",
    deeds: [
      "Prophet who prepared the way for Jesus.",
      "Lived in the wilderness and baptized Jesus."
    ]
  },
  {
    name: "Mary Magdalene",
    era: "Apostles",
    deeds: [
      "First to see Jesus after resurrection.",
      "Traveled with and supported Jesus."
    ]
  },
  {
    name: "Lydia",
    era: "Early Church",
    deeds: [
      "First convert to Christianity in Europe.",
      "Opened her home to Paul and Silas."
    ]
  },
  {
    name: "Timothy",
    era: "Early Church",
    deeds: [
      "Young leader mentored by Paul.",
      "Encouraged to not let others despise his youth."
    ]
  },
  {
    name: "Tabitha (Dorcas)",
    era: "Early Church",
    deeds: [
      "Known for charity and making clothes.",
      "Raised from the dead by Peter."
    ]
  },
  {
    name: "Barnabas",
    era: "Early Church",
    deeds: [
      "Known as 'Son of Encouragement'.",
      "Sold a field to give to the apostles."
    ]
  },
  {
    name: "Priscilla",
    era: "Early Church",
    deeds: [
      "Tentmaker who mentored Apollos.",
      "Hosted a church in her home."
    ]
  },
  {
    name: "Ehud",
    era: "Judges",
    deeds: [
      "Left-handed judge of Israel.",
      "Defeated Eglon, king of Moab."
    ]
  }
];
