export interface MissionaryChoice {
  text: string;
  nextNodeId: string;
  xpReward?: number;
  requirement?: string;
  isCorrect?: boolean;
  explanation?: string;
}

export interface MissionaryNode {
  id: string;
  title: string;
  description: string;
  choices: MissionaryChoice[];
  image?: string;
  location?: string;
}

export const MISSIONARY_JOURNEYS: Record<string, MissionaryNode> = {
  start: {
    id: 'start',
    title: 'The Ascension',
    description: 'After His resurrection, Jesus gathers His disciples on the Mount of Olives. He tells them they will receive power when the Holy Spirit comes and will be His witnesses in Jerusalem, Judea, Samaria, and to the ends of the earth. Then, He is taken up into a cloud.',
    location: 'Mount of Olives',
    choices: [
      { text: 'Wait in Jerusalem for the Holy Spirit.', nextNodeId: 'pentecost', isCorrect: true },
      { text: 'Immediately start preaching in the temple.', nextNodeId: 'start', isCorrect: false, explanation: 'Jesus specifically commanded the disciples to wait in Jerusalem for the gift the Father promised.' },
      { text: 'Return to Galilee to continue fishing.', nextNodeId: 'start', isCorrect: false, explanation: 'The disciples were called to be witnesses, not to return to their old lives.' },
      { text: 'Try to find where Jesus went in the clouds.', nextNodeId: 'start', isCorrect: false, explanation: 'Two men in white stood by them and said, "Why do you stand here looking into the sky?"' }
    ]
  },
  pentecost: {
    id: 'pentecost',
    title: 'The Day of Pentecost',
    description: 'While the disciples are gathered in one place, a sound like a violent wind fills the house. Tongues of fire rest on each of them, and they begin to speak in other languages. A crowd gathers, bewildered by what they hear.',
    location: 'Jerusalem',
    choices: [
      { text: 'Peter stands up and explains the prophecy of Joel.', nextNodeId: 'early_church', isCorrect: true, xpReward: 50 },
      { text: 'Tell the crowd they are all drunk.', nextNodeId: 'pentecost', isCorrect: false, explanation: 'Some in the crowd made this claim, but Peter corrected them, noting it was only nine in the morning.' },
      { text: 'Hide in the upper room until the crowd leaves.', nextNodeId: 'pentecost', isCorrect: false, explanation: 'The Holy Spirit empowered them to be bold witnesses, not to hide.' },
      { text: 'Ask the crowd for money to support the ministry.', nextNodeId: 'pentecost', isCorrect: false, explanation: 'The focus was on the message of the Gospel and the power of the Spirit, not financial gain.' }
    ]
  },
  early_church: {
    id: 'early_church',
    title: 'The Early Church',
    description: 'About three thousand are added to their number that day. The believers devote themselves to the apostles\' teaching, to fellowship, to the breaking of bread, and to prayer. They share everything they have.',
    location: 'Jerusalem',
    choices: [
      { text: 'Peter and John heal a lame man at the Beautiful Gate.', nextNodeId: 'sanhedrin_trial', isCorrect: true, xpReward: 50 },
      { text: 'Establish a strict hierarchy with Peter as King.', nextNodeId: 'early_church', isCorrect: false, explanation: 'The early church was characterized by communal living and service, not a worldly monarchy.' },
      { text: 'Stop preaching to avoid trouble with the authorities.', nextNodeId: 'early_church', isCorrect: false, explanation: 'They continued to meet in the temple courts and preach daily.' },
      { text: 'Charge people for the apostles\' teaching.', nextNodeId: 'early_church', isCorrect: false, explanation: 'The Gospel was shared freely, and they shared their possessions with anyone in need.' }
    ]
  },
  sanhedrin_trial: {
    id: 'sanhedrin_trial',
    title: 'Before the Sanhedrin',
    description: 'The priests and the captain of the temple guard are disturbed by the preaching of the resurrection. They seize Peter and John and bring them before the Sanhedrin. They are commanded not to speak or teach at all in the name of Jesus.',
    location: 'Jerusalem',
    choices: [
      { text: '"We cannot help speaking about what we have seen and heard."', nextNodeId: 'stephen_martyr', isCorrect: true, xpReward: 100 },
      { text: 'Agree to stop preaching to save their lives.', nextNodeId: 'sanhedrin_trial', isCorrect: false, explanation: 'Peter and John were bold and refused to stop witnessing for Christ.' },
      { text: 'Try to bribe the high priest for freedom.', nextNodeId: 'sanhedrin_trial', isCorrect: false, explanation: 'The apostles relied on the power of God, not worldly corruption.' },
      { text: 'Call for a violent revolt against the Romans.', nextNodeId: 'sanhedrin_trial', isCorrect: false, explanation: 'The kingdom of God is not of this world; they preached peace and salvation.' }
    ]
  },
  stephen_martyr: {
    id: 'stephen_martyr',
    title: 'The First Martyr',
    description: 'Stephen, a man full of God\'s grace and power, performs great wonders. Opposition arises, and he is brought before the Sanhedrin. After a powerful speech, the crowd becomes furious and drags him out of the city to stone him.',
    location: 'Outside Jerusalem',
    choices: [
      { text: 'Stephen prays, "Lord, do not hold this sin against them."', nextNodeId: 'philip_samaria', isCorrect: true, xpReward: 150 },
      { text: 'Stephen calls down fire from heaven to consume them.', nextNodeId: 'stephen_martyr', isCorrect: false, explanation: 'Stephen followed the example of Jesus, praying for his persecutors even as he died.' },
      { text: 'The disciples fight back with swords to save Stephen.', nextNodeId: 'stephen_martyr', isCorrect: false, explanation: 'The early Christians accepted martyrdom as a witness to their faith.' },
      { text: 'Stephen recants his faith to escape the stoning.', nextNodeId: 'stephen_martyr', isCorrect: false, explanation: 'Stephen remained faithful unto death, seeing the glory of God as he died.' }
    ]
  },
  philip_samaria: {
    id: 'philip_samaria',
    title: 'Philip in Samaria',
    description: 'A great persecution breaks out, and the believers are scattered. Philip goes to a city in Samaria and proclaims the Messiah there. Many believe and are baptized. Later, an angel tells Philip to go south to the desert road.',
    location: 'Samaria / Desert Road',
    choices: [
      { text: 'Explain the scriptures to the Ethiopian eunuch.', nextNodeId: 'saul_conversion', isCorrect: true, xpReward: 100 },
      { text: 'Ignore the Ethiopian official because he is a foreigner.', nextNodeId: 'philip_samaria', isCorrect: false, explanation: 'Philip obeyed the Spirit and ran to the chariot to share the Gospel.' },
      { text: 'Try to sell Philip\'s miraculous powers to Simon the Sorcerer.', nextNodeId: 'philip_samaria', isCorrect: false, explanation: 'Peter rebuked Simon for trying to buy the gift of God with money.' },
      { text: 'Return to Jerusalem to hide from the persecution.', nextNodeId: 'philip_samaria', isCorrect: false, explanation: 'Philip followed the Spirit\'s leading to reach new people.' }
    ]
  },
  saul_conversion: {
    id: 'saul_conversion',
    title: 'The Road to Damascus',
    description: 'Saul, breathing out murderous threats against the Lord\'s disciples, travels to Damascus. Suddenly a light from heaven flashes around him. He falls to the ground and hears a voice: "Saul, Saul, why do you persecute me?"',
    location: 'Road to Damascus',
    choices: [
      { text: '"Who are you, Lord?"', nextNodeId: 'peter_cornelius', isCorrect: true, xpReward: 100 },
      { text: 'Try to fight the light with his sword.', nextNodeId: 'saul_conversion', isCorrect: false, explanation: 'The divine light was overwhelming; Saul was blinded and humbled.' },
      { text: 'Argue that he is doing God\'s work by killing Christians.', nextNodeId: 'saul_conversion', isCorrect: false, explanation: 'The voice identified itself as Jesus, whom Saul was persecuting.' },
      { text: 'Assume it is a natural phenomenon and ignore it.', nextNodeId: 'saul_conversion', isCorrect: false, explanation: 'The experience was clearly supernatural and changed Saul\'s life forever.' }
    ]
  },
  peter_cornelius: {
    id: 'peter_cornelius',
    title: 'Peter and Cornelius',
    description: 'Peter has a vision of a sheet containing all kinds of animals and is told, "Do not call anything impure that God has made clean." Men sent by Cornelius, a Roman centurion, arrive and ask Peter to come with them.',
    location: 'Joppa / Caesarea',
    choices: [
      { text: 'Go with the men and preach to the Gentiles.', nextNodeId: 'herod_persecution', isCorrect: true, xpReward: 150 },
      { text: 'Refuse to enter a Gentile\'s house as it is "unclean."', nextNodeId: 'peter_cornelius', isCorrect: false, explanation: 'The vision taught Peter that God does not show favoritism and the Gospel is for all.' },
      { text: 'Tell Cornelius he must first become a Jew.', nextNodeId: 'peter_cornelius', isCorrect: false, explanation: 'The Holy Spirit fell on the Gentiles while Peter was still speaking, confirming their faith.' },
      { text: 'Ask for a Roman commission to protect the church.', nextNodeId: 'peter_cornelius', isCorrect: false, explanation: 'The focus was on spiritual salvation, not political alliances.' }
    ]
  },
  herod_persecution: {
    id: 'herod_persecution',
    title: 'Peter\'s Miraculous Escape',
    description: 'King Herod arrests some who belong to the church, intending to persecute them. He has James put to death and proceeds to seize Peter. While Peter is in prison, the church prays earnestly for him.',
    location: 'Jerusalem Prison',
    choices: [
      { text: 'An angel leads Peter out of the prison.', nextNodeId: 'first_journey', isCorrect: true, xpReward: 100 },
      { text: 'Peter organizes a prison break with the other inmates.', nextNodeId: 'herod_persecution', isCorrect: false, explanation: 'Peter was sleeping between two soldiers when an angel miraculously freed him.' },
      { text: 'The church pays a heavy ransom to Herod.', nextNodeId: 'herod_persecution', isCorrect: false, explanation: 'God delivered Peter through prayer and divine intervention, not money.' },
      { text: 'Peter accepts his fate and waits for execution.', nextNodeId: 'herod_persecution', isCorrect: false, explanation: 'God had more work for Peter to do, and he followed the angel out.' }
    ]
  },
  first_journey: {
    id: 'first_journey',
    title: 'The First Journey',
    description: 'The Holy Spirit says, "Set apart for me Barnabas and Saul for the work to which I have called them." They travel to Cyprus and then to Asia Minor. In Lystra, Paul heals a lame man, and the crowd tries to worship them as gods.',
    location: 'Lystra',
    choices: [
      { text: '"We are only human! Turn to the living God!"', nextNodeId: 'jerusalem_council', isCorrect: true, xpReward: 150 },
      { text: 'Accept the worship to gain influence in the city.', nextNodeId: 'first_journey', isCorrect: false, explanation: 'Paul and Barnabas were horrified and tore their clothes, redirecting the glory to God.' },
      { text: 'Perform more tricks to keep the crowd entertained.', nextNodeId: 'first_journey', isCorrect: false, explanation: 'The miracles were signs to point to the Gospel, not for entertainment.' },
      { text: 'Flee immediately without saying anything.', nextNodeId: 'first_journey', isCorrect: false, explanation: 'They stayed to preach the truth and correct the crowd\'s misconception.' }
    ]
  },
  jerusalem_council: {
    id: 'jerusalem_council',
    title: 'The Jerusalem Council',
    description: 'Certain people come from Judea and teach that Gentiles must be circumcised to be saved. This leads to a sharp dispute. Paul and Barnabas go to Jerusalem to see the apostles and elders about this question.',
    location: 'Jerusalem',
    choices: [
      { text: 'The council decides that Gentiles are saved by grace.', nextNodeId: 'macedonian_call', isCorrect: true, xpReward: 200 },
      { text: 'The council demands all Gentiles follow every Jewish law.', nextNodeId: 'jerusalem_council', isCorrect: false, explanation: 'The council concluded that God made no distinction between Jews and Gentiles, purifying their hearts by faith.' },
      { text: 'Paul decides to start a separate "Gentile-only" church.', nextNodeId: 'jerusalem_council', isCorrect: false, explanation: 'The goal was unity in the body of Christ, not division.' },
      { text: 'They decide to stop preaching to Gentiles altogether.', nextNodeId: 'jerusalem_council', isCorrect: false, explanation: 'They sent a letter encouraging the Gentile believers and confirming their place in the church.' }
    ]
  },
  macedonian_call: {
    id: 'macedonian_call',
    title: 'The Macedonian Call',
    description: 'Paul and his companions travel through Phrygia and Galatia, but the Holy Spirit keeps them from preaching in Asia. During the night, Paul has a vision of a man of Macedonia begging him, "Come over and help us."',
    location: 'Troas',
    choices: [
      { text: 'Immediately set sail for Macedonia.', nextNodeId: 'philippi_prison', isCorrect: true, xpReward: 100 },
      { text: 'Ignore the vision and try to enter Bithynia again.', nextNodeId: 'macedonian_call', isCorrect: false, explanation: 'The Spirit of Jesus would not allow them to enter Bithynia; they obeyed the vision.' },
      { text: 'Wait for a clearer sign from heaven.', nextNodeId: 'macedonian_call', isCorrect: false, explanation: 'They concluded that God had called them and left at once.' },
      { text: 'Return to Antioch to ask for permission.', nextNodeId: 'macedonian_call', isCorrect: false, explanation: 'They were already sent by the Spirit and followed the immediate leading.' }
    ]
  },
  philippi_prison: {
    id: 'philippi_prison',
    title: 'Singing in the Night',
    description: 'In Philippi, Paul and Silas are stripped, beaten, and thrown into the inner cell of a prison. At midnight, they are praying and singing hymns to God, and the other prisoners are listening to them.',
    location: 'Philippi Prison',
    choices: [
      { text: 'An earthquake opens the doors; they stay to save the jailer.', nextNodeId: 'athens_mars_hill', isCorrect: true, xpReward: 150 },
      { text: 'They use the earthquake to escape and hide.', nextNodeId: 'philippi_prison', isCorrect: false, explanation: 'They stayed in the prison, which led to the conversion of the jailer and his household.' },
      { text: 'They complain to God about their unfair treatment.', nextNodeId: 'philippi_prison', isCorrect: false, explanation: 'They were full of joy and sang hymns despite their suffering.' },
      { text: 'They try to bribe the guards for better food.', nextNodeId: 'philippi_prison', isCorrect: false, explanation: 'Their focus was on spiritual worship and witnessing, not physical comfort.' }
    ]
  },
  athens_mars_hill: {
    id: 'athens_mars_hill',
    title: 'The Unknown God',
    description: 'In Athens, Paul is distressed by the many idols. He is taken to the Areopagus. He says, "I see that in every way you are very religious... I found an altar with this inscription: TO AN UNKNOWN GOD."',
    location: 'Athens',
    choices: [
      { text: 'Proclaim the Resurrection of Jesus.', nextNodeId: 'ephesus_ministry', isCorrect: true, xpReward: 100 },
      { text: 'Mock the Athenians for their foolishness.', nextNodeId: 'athens_mars_hill', isCorrect: false, explanation: 'Paul used their own culture as a bridge to share the truth of the Gospel.' },
      { text: 'Agree that all their gods are equally valid.', nextNodeId: 'athens_mars_hill', isCorrect: false, explanation: 'Paul preached that there is only one true God who made the world.' },
      { text: 'Focus only on Jewish law and ignore the idols.', nextNodeId: 'athens_mars_hill', isCorrect: false, explanation: 'Paul addressed the specific context of the Athenians to reach them.' }
    ]
  },
  ephesus_ministry: {
    id: 'ephesus_ministry',
    title: 'Ministry in Ephesus',
    description: 'Paul spends over two years in Ephesus. God does extraordinary miracles through him. Many who practiced sorcery bring their scrolls and burn them publicly. However, Demetrius the silversmith starts a riot.',
    location: 'Ephesus',
    choices: [
      { text: 'Paul encourages the disciples and leaves for Macedonia.', nextNodeId: 'jerusalem_arrest', isCorrect: true, xpReward: 150 },
      { text: 'Paul fights the silversmiths in the streets.', nextNodeId: 'ephesus_ministry', isCorrect: false, explanation: 'Paul avoided unnecessary conflict and left when the riot subsided to continue his mission.' },
      { text: 'Paul stops preaching to save the local economy.', nextNodeId: 'ephesus_ministry', isCorrect: false, explanation: 'The Gospel continued to spread, even when it challenged worldly businesses.' },
      { text: 'Paul calls for a boycott of the temple of Artemis.', nextNodeId: 'ephesus_ministry', isCorrect: false, explanation: 'The change came through hearts turning to Christ, not political boycotts.' }
    ]
  },
  jerusalem_arrest: {
    id: 'jerusalem_arrest',
    title: 'Bound for Jerusalem',
    description: 'Despite warnings that he will be bound, Paul says, "I am ready not only to be bound, but also to die in Jerusalem for the name of the Lord Jesus." In the temple, a crowd seizes him, and he is arrested by the Romans.',
    location: 'Jerusalem',
    choices: [
      { text: 'Paul uses his trial to witness to kings and governors.', nextNodeId: 'shipwreck_voyage', isCorrect: true, xpReward: 200 },
      { text: 'Paul tries to escape the Roman guards.', nextNodeId: 'jerusalem_arrest', isCorrect: false, explanation: 'Paul accepted his imprisonment as an opportunity to share the Gospel with high-ranking officials.' },
      { text: 'Paul denies being a follower of Jesus to be released.', nextNodeId: 'jerusalem_arrest', isCorrect: false, explanation: 'Paul stood firm in his faith, even before Felix, Festus, and King Agrippa.' },
      { text: 'Paul asks the Jews for forgiveness for his preaching.', nextNodeId: 'jerusalem_arrest', isCorrect: false, explanation: 'Paul defended his message and his calling from God.' }
    ]
  },
  shipwreck_voyage: {
    id: 'shipwreck_voyage',
    title: 'The Storm and Shipwreck',
    description: 'On the way to Rome, a "northeaster" storm strikes. For many days, the crew loses all hope. Paul stands up and says, "Keep up your courage, for not one of you will be lost; only the ship will be destroyed."',
    location: 'The Great Sea',
    choices: [
      { text: 'The ship runs aground; everyone reaches land on Malta.', nextNodeId: 'rome_arrival', isCorrect: true, xpReward: 200 },
      { text: 'The sailors abandon the ship in the lifeboats.', nextNodeId: 'shipwreck_voyage', isCorrect: false, explanation: 'Paul warned that they must stay with the ship to be saved, and the soldiers cut the ropes.' },
      { text: 'Paul tries to steer the ship himself.', nextNodeId: 'shipwreck_voyage', isCorrect: false, explanation: 'They were at the mercy of the storm, but God preserved them as Paul promised.' },
      { text: 'They throw Paul overboard to calm the sea.', nextNodeId: 'shipwreck_voyage', isCorrect: false, explanation: 'Unlike Jonah, Paul was the source of hope and divine promise for the crew.' }
    ]
  },
  rome_arrival: {
    id: 'rome_arrival',
    title: 'Rome at Last',
    description: 'Paul finally reaches Rome. For two whole years he stays in his own rented house and welcomes all who come to see him. He proclaims the kingdom of God and teaches about the Lord Jesus Christ with all boldness.',
    location: 'Rome',
    choices: [
      { text: 'Continue the mission from house arrest.', nextNodeId: 'victory', isCorrect: true, xpReward: 300 },
      { text: 'Retire and stop writing letters.', nextNodeId: 'rome_arrival', isCorrect: false, explanation: 'Paul wrote many of his most important letters (Ephesians, Philippians, Colossians) from Rome.' },
      { text: 'Try to overthrow Nero.', nextNodeId: 'rome_arrival', isCorrect: false, explanation: 'Paul preached the Gospel of the Kingdom, which is not of this world.' },
      { text: 'Escape to Spain immediately.', nextNodeId: 'rome_arrival', isCorrect: false, explanation: 'He remained in Rome for two years, fulfilling his calling to witness in the heart of the empire.' }
    ]
  },
  victory: {
    id: 'victory',
    title: 'The Race Finished',
    description: 'The Book of Acts ends with the Gospel being preached in Rome without hindrance. You have followed the journey from a small room in Jerusalem to the capital of the world. The mission continues through you.',
    location: 'The Ends of the Earth',
    choices: [
      { text: 'Play Again', nextNodeId: 'start', isCorrect: true }
    ]
  }
};
