export const TEST_EXAMPLES = {
  safe: "This is a neutral, harmless text about cooking pasta and taking a walk in the park.",
  
  hateSpeech: "All immigrants are criminals and should be expelled from our country.",
  
  violence: "I'm going to beat you up and make you suffer for what you did to me.",
  
  sexualContent: "Explicit sexual content and graphic descriptions of intimate activities.",
  
  spam: "CLICK HERE NOW!!! LIMITED TIME OFFER!!! Make $10,000 in 24 hours!!!",
  
  harassmentAndBullying: "You are a worthless idiot and everyone at work hates you. Just quit already.",
  
  selfHarmOrSuicideEncouragement: "Life is meaningless, you should just end it all now.",
  
  illegalActivities: "Here's how to break into houses and steal valuable items without getting caught.",
  
  misinformationFakeNews: "The government is hiding aliens and controlling our minds with 5G technology.",
  
  terrorismRelatedContent: "Instructions for making explosives and planning attacks on civilian targets.",
  
  hateSymbolsAndExtremistContent: "Symbols and content promoting extremist ideologies and hate groups.",
} as const;

export type TestExampleKey = keyof typeof TEST_EXAMPLES;
