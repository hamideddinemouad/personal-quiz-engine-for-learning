export const questions = [
  {
    id: 'q1',
    type: 'mcq',
    question: 'According to the passage, what does Alex do on Saturday?',
    options: [
      {
        text: 'Alex does ballet and plays the guitar.',
        isCorrect: true,
        feedback:
          'Correct. Saturday is described with ballet and guitar for Alex.'
      },
      {
        text: 'Alex does judo and plays the piano.',
        isCorrect: false,
        feedback:
          'Incorrect. Judo and piano are Alex\'s Sunday activities, not Saturday ones.'
      },
      {
        text: 'Alex plays basketball and the drums with Mia.',
        isCorrect: false,
        feedback:
          'Incorrect. Basketball and drums are linked to Mia, and Alex even says he does not play basketball.'
      },
      {
        text: 'Alex plays tennis and football in the park with Ben.',
        isCorrect: false,
        feedback:
          'Incorrect. Tennis and football in the park are presented as Ben\'s activities.'
      }
    ],
    hint: 'Look at the sentence that starts with "On Saturday."',
    requiresWhy: true,
    whyQuestion: 'Why is "judo and piano" a tempting but still incorrect option here?',
    whyOptions: [
      {
        text: 'Those are real Alex activities, but they belong to Sunday, so the day is wrong.',
        isCorrect: true,
        feedback:
          'Correct. The option mixes correct details with the wrong time context.'
      },
      {
        text: 'They are Ben\'s regular Saturday activities, so the person is wrong.',
        isCorrect: false,
        feedback:
          'Incorrect. Ben is not described as doing judo or piano in the passage.'
      },
      {
        text: 'The passage says Alex never does judo or piano at any time.',
        isCorrect: false,
        feedback:
          'Incorrect. Alex explicitly says he does judo and also plays piano on Sunday.'
      }
    ]
  },
  {
    id: 'q2',
    type: 'mcq',
    question: 'Which statement best compares Alex and Ben in the text?',
    options: [
      {
        text: 'Alex does ballet and judo, while Ben likes tennis and sometimes plays football.',
        isCorrect: true,
        feedback:
          'Correct. This matches the core sports contrast shown across Saturday, afternoon, and Sunday details.'
      },
      {
        text: 'Alex likes tennis most, while Ben does ballet every weekend.',
        isCorrect: false,
        feedback:
          'Incorrect. Tennis is linked to Ben, and ballet is linked to Alex on Saturday.'
      },
      {
        text: 'Both Alex and Ben do karate, but only Alex plays football.',
        isCorrect: false,
        feedback:
          'Incorrect. Ben does not do karate, and football is connected to Ben, not Alex.'
      },
      {
        text: 'Ben only plays music instruments, while Alex only plays team sports.',
        isCorrect: false,
        feedback:
          'Incorrect. Ben is shown with sports, and Alex also plays instruments like guitar and piano.'
      }
    ],
    hint: 'Compare what each person does across multiple paragraphs.',
    requiresWhy: true,
    whyQuestion: 'Why is "Ben does not do karate" an important comparison detail?',
    whyOptions: [
      {
        text: 'It prevents a common mix-up by showing Ben\'s limits, not just what he likes.',
        isCorrect: true,
        feedback:
          'Correct. Good comparison includes both positive preferences and explicit negatives.'
      },
      {
        text: 'It proves Ben dislikes all sports, including tennis and football.',
        isCorrect: false,
        feedback:
          'Incorrect. Ben is still described as liking tennis and sometimes playing football.'
      },
      {
        text: 'It means Alex also avoids karate for the same reason.',
        isCorrect: false,
        feedback:
          'Incorrect. The statement about karate difficulty is only attributed to Ben.'
      }
    ]
  },
  {
    id: 'q3',
    type: 'mcq',
    question: 'In the afternoon, who does Alex often play chess with?',
    options: [
      {
        text: 'His dad.',
        isCorrect: true,
        feedback:
          'Correct. The passage says Alex often plays chess with his dad.'
      },
      {
        text: 'His mom.',
        isCorrect: false,
        feedback:
          'Incorrect. The text specifically mentions Alex\'s dad, not his mom.'
      },
      {
        text: 'Ben.',
        isCorrect: false,
        feedback:
          'Incorrect. Ben is mentioned with football in the park, not as Alex\'s chess partner.'
      },
      {
        text: 'Mia.',
        isCorrect: false,
        feedback:
          'Incorrect. Mia is described with basketball and drums, not chess with Alex.'
      }
    ],
    hint: 'Find the sentence with the phrase "play chess."',
    requiresWhy: true,
    whyQuestion: 'Why does the word "often" matter in this sentence?',
    whyOptions: [
      {
        text: 'It signals a regular habit without claiming it happens every single time.',
        isCorrect: true,
        feedback:
          'Correct. "Often" describes frequency, not an absolute rule like always.'
      },
      {
        text: 'It means Alex only played chess once in the past.',
        isCorrect: false,
        feedback:
          'Incorrect. "Often" suggests repeated behavior, not a one-time event.'
      },
      {
        text: 'It cancels the information about his dad being the chess partner.',
        isCorrect: false,
        feedback:
          'Incorrect. Frequency wording does not change who the partner is.'
      }
    ]
  },
  {
    id: 'q4',
    type: 'mcq',
    question: 'Your class is building Alex\'s Sunday plan. Which option matches the text?',
    options: [
      {
        text: 'Do judo and play the piano.',
        isCorrect: true,
        feedback:
          'Correct. Sunday is explicitly linked to judo and piano for Alex.'
      },
      {
        text: 'Do ballet and play tennis.',
        isCorrect: false,
        feedback:
          'Incorrect. Ballet is Alex\'s Saturday activity, and tennis is associated with Ben.'
      },
      {
        text: 'Play basketball and drums with Mia.',
        isCorrect: false,
        feedback:
          'Incorrect. Those activities are Mia\'s, and Alex says he does not play basketball.'
      },
      {
        text: 'Play football in the park and do karate.',
        isCorrect: false,
        feedback:
          'Incorrect. Football in the park is Ben\'s occasional activity, and Ben does not do karate.'
      }
    ],
    hint: 'Focus on the paragraph that begins with "On Sunday."',
    requiresWhy: true,
    whyQuestion: 'Why is "play guitar" not the best Sunday answer even though Alex likes guitar?',
    whyOptions: [
      {
        text: 'Because the Sunday-specific schedule in the passage names judo and piano.',
        isCorrect: true,
        feedback:
          'Correct. A day-specific question should prioritize activities explicitly tied to that day.'
      },
      {
        text: 'Because Alex says he hates guitar and stopped playing it.',
        isCorrect: false,
        feedback:
          'Incorrect. Alex says he likes guitar, even if he is not very good at it.'
      },
      {
        text: 'Because guitar is only Mia\'s instrument, not Alex\'s.',
        isCorrect: false,
        feedback:
          'Incorrect. Alex is clearly described as playing guitar as well.'
      }
    ]
  },
  {
    id: 'q5',
    type: 'mcq',
    question:
      'Which statement about basketball and drums is accurate according to the passage?',
    options: [
      {
        text: 'Mia plays basketball and drums, Alex does not play basketball, and Ben does not play drums.',
        isCorrect: true,
        feedback:
          'Correct. This combines the key positive and negative details exactly as written.'
      },
      {
        text: 'Alex and Ben both play drums, but Mia only plays basketball.',
        isCorrect: false,
        feedback:
          'Incorrect. Ben is explicitly said not to play drums, and Mia does play drums.'
      },
      {
        text: 'Ben plays basketball in the park, and Alex plays drums at home.',
        isCorrect: false,
        feedback:
          'Incorrect. The text links Ben with football in the park and does not say Alex plays drums.'
      },
      {
        text: 'Mia does not play drums because her music is quiet.',
        isCorrect: false,
        feedback:
          'Incorrect. Mia likes drums and her music is described as loud, not quiet.'
      }
    ],
    hint: 'Track each person separately and pay attention to "does not" statements.',
    requiresWhy: true,
    whyQuestion: 'Why are the negative statements in this passage easy to misuse?',
    whyOptions: [
      {
        text: 'Because repeated activity words can cause readers to assign actions to the wrong person unless they track negation carefully.',
        isCorrect: true,
        feedback:
          'Correct. Negation flips meaning, so person-by-person tracking is essential.'
      },
      {
        text: 'Because negation in English always means the opposite person does that activity.',
        isCorrect: false,
        feedback:
          'Incorrect. A negative statement only tells you what that specific subject does not do.'
      },
      {
        text: 'Because negation can be ignored when another sentence has a similar verb.',
        isCorrect: false,
        feedback:
          'Incorrect. Ignoring negation creates direct contradictions with the passage.'
      }
    ]
  },
  {
    id: 'q6',
    type: 'mcq',
    question: 'Which activity is described as occasional rather than regular?',
    options: [
      {
        text: 'Ben sometimes plays football with his friends in the park.',
        isCorrect: true,
        feedback:
          'Correct. The word "sometimes" marks this as occasional behavior.'
      },
      {
        text: 'Alex often plays chess with his dad.',
        isCorrect: false,
        feedback:
          'Incorrect. "Often" indicates a frequent habit, not an occasional one.'
      },
      {
        text: 'Mia loves to play basketball.',
        isCorrect: false,
        feedback:
          'Incorrect. "Loves" expresses strong preference, not occasional frequency.'
      },
      {
        text: 'Alex does judo on Sunday.',
        isCorrect: false,
        feedback:
          'Incorrect. This is a scheduled Sunday fact, not the activity labeled with "sometimes."'
      }
    ],
    hint: 'Look for explicit frequency words in the text.',
    requiresWhy: true,
    whyQuestion: 'Why does distinguishing "often" from "sometimes" matter in comprehension?',
    whyOptions: [
      {
        text: 'It helps you avoid turning frequency clues into wrong assumptions about habits and schedules.',
        isCorrect: true,
        feedback:
          'Correct. Frequency words change how strong a claim is about repetition.'
      },
      {
        text: 'Both words always mean exactly the same frequency in reading tasks.',
        isCorrect: false,
        feedback:
          'Incorrect. "Often" and "sometimes" signal different levels of regularity.'
      },
      {
        text: 'Frequency words are decorative and can be removed without changing meaning.',
        isCorrect: false,
        feedback:
          'Incorrect. They add important constraints about how repeatedly actions happen.'
      }
    ]
  },
  {
    id: 'q7',
    type: 'mcq',
    question: 'In the sentence "He thinks it is too hard," what does "it" refer to?',
    options: [
      {
        text: 'Karate.',
        isCorrect: true,
        feedback:
          'Correct. The sentence directly follows "Ben does not do karate," so "it" points to karate.'
      },
      {
        text: 'Judo.',
        isCorrect: false,
        feedback:
          'Incorrect. Judo is Alex\'s Sunday sport, not the activity Ben rejects as too hard.'
      },
      {
        text: 'Football.',
        isCorrect: false,
        feedback:
          'Incorrect. Ben sometimes plays football; the "too hard" comment is about karate.'
      },
      {
        text: 'Chess.',
        isCorrect: false,
        feedback:
          'Incorrect. Chess is mentioned with Alex and his dad, not in Ben\'s karate sentence.'
      }
    ],
    hint: 'Use the nearest activity mentioned just before that pronoun.',
    requiresWhy: true,
    whyQuestion: 'Why is pronoun reference useful in reading questions like this?',
    whyOptions: [
      {
        text: 'It connects short words like "it" to the correct earlier noun so meaning stays precise.',
        isCorrect: true,
        feedback:
          'Correct. Pronoun tracking prevents misreading who or what a sentence is about.'
      },
      {
        text: 'It lets you ignore earlier sentences and guess from only the final clause.',
        isCorrect: false,
        feedback:
          'Incorrect. You usually need nearby context to resolve pronouns correctly.'
      },
      {
        text: 'Pronouns always refer to the first noun in the entire passage.',
        isCorrect: false,
        feedback:
          'Incorrect. Pronouns usually point to relevant local context, not the first noun globally.'
      }
    ]
  },
  {
    id: 'q8',
    type: 'mcq',
    question:
      'Debug this summary: "Ben does karate and Alex is very good at guitar." Which correction is best?',
    options: [
      {
        text: 'Ben does not do karate because he thinks it is too hard, and Alex likes guitar but says he is not very good at it.',
        isCorrect: true,
        feedback:
          'Correct. This fixes both factual errors using the exact ideas from the passage.'
      },
      {
        text: 'Ben does karate on Sundays, and Alex is excellent at piano only.',
        isCorrect: false,
        feedback:
          'Incorrect. Ben is explicitly said not to do karate, and Alex\'s guitar skill is described as weak.'
      },
      {
        text: 'Ben never plays sports, and Alex does not play any instruments.',
        isCorrect: false,
        feedback:
          'Incorrect. Ben likes tennis and sometimes football, while Alex plays guitar and piano.'
      },
      {
        text: 'Ben plays drums with Mia, and Alex avoids music completely.',
        isCorrect: false,
        feedback:
          'Incorrect. Ben does not play drums, and Alex is clearly involved in music activities.'
      }
    ],
    hint: 'Check both claims separately; each one has an error.',
    requiresWhy: true,
    whyQuestion: 'Why must both parts of the summary be corrected, not just one?',
    whyOptions: [
      {
        text: 'Because each clause makes a separate factual claim, and leaving one wrong still makes the overall summary unreliable.',
        isCorrect: true,
        feedback:
          'Correct. Accurate summaries require all included claims to match source facts.'
      },
      {
        text: 'Because summaries are graded only on sentence length, not factual accuracy.',
        isCorrect: false,
        feedback:
          'Incorrect. Comprehension summaries are primarily evaluated by correctness.'
      },
      {
        text: 'Because fixing one claim automatically makes every other claim true.',
        isCorrect: false,
        feedback:
          'Incorrect. Each statement must be validated independently against the text.'
      }
    ]
  },
  {
    id: 'q9',
    type: 'mcq',
    question: 'Which pair of statements can both be true based on the passage?',
    options: [
      {
        text: 'Alex likes to play the guitar, and Ben likes to play tennis.',
        isCorrect: true,
        feedback:
          'Correct. Both preferences are explicitly stated and repeated in the passage.'
      },
      {
        text: 'Alex plays basketball, and Mia avoids sports.',
        isCorrect: false,
        feedback:
          'Incorrect. Alex says he does not play basketball, and Mia is described as good at sports.'
      },
      {
        text: 'Ben plays the drums, and Mia\'s music is quiet.',
        isCorrect: false,
        feedback:
          'Incorrect. Ben does not play drums, and Mia\'s drum music is described as loud.'
      },
      {
        text: 'Alex plays chess with his mom, and Ben hates football.',
        isCorrect: false,
        feedback:
          'Incorrect. Alex plays chess with his dad, and Ben is said to sometimes play football.'
      }
    ],
    hint: 'Choose the option where both claims match the text exactly.',
    requiresWhy: true,
    whyQuestion: 'Why is this a stronger comprehension test than checking one sentence only?',
    whyOptions: [
      {
        text: 'It verifies you can combine facts from different parts of the passage without creating contradictions.',
        isCorrect: true,
        feedback:
          'Correct. Multi-claim checks test consistency across the full text.'
      },
      {
        text: 'It is easier because one true claim is enough for a pair to be correct.',
        isCorrect: false,
        feedback:
          'Incorrect. Both claims must be true for the pair to be valid.'
      },
      {
        text: 'It removes the need to track who each action belongs to.',
        isCorrect: false,
        feedback:
          'Incorrect. Person-action mapping becomes even more important in paired statements.'
      }
    ]
  },
  {
    id: 'q10',
    type: 'mcq',
    question: 'Which conclusion best captures the weekend pattern described in the passage?',
    options: [
      {
        text: 'Alex has different activities by day, and Ben and Mia have their own distinct sports and music interests.',
        isCorrect: true,
        feedback:
          'Correct. This summary reflects schedule details, person differences, and activity preferences together.'
      },
      {
        text: 'Everyone mostly follows Alex\'s plan, so their hobbies are nearly the same.',
        isCorrect: false,
        feedback:
          'Incorrect. The passage highlights differences among Alex, Ben, and Mia rather than a shared routine.'
      },
      {
        text: 'The passage is only about one sport and does not include music activities.',
        isCorrect: false,
        feedback:
          'Incorrect. Multiple sports and instruments are described throughout the text.'
      },
      {
        text: 'Ben and Mia are discussed only once, so their details are unimportant.',
        isCorrect: false,
        feedback:
          'Incorrect. Ben and Mia appear in multiple lines and are central to comparison questions.'
      }
    ],
    hint: 'Pick the option that integrates day, person, and activity details.',
    requiresWhy: true,
    whyQuestion: 'Why is the best conclusion broader than a single detail like "Alex does ballet"?',
    whyOptions: [
      {
        text: 'Because a strong conclusion synthesizes several consistent facts instead of repeating one isolated line.',
        isCorrect: true,
        feedback:
          'Correct. Conclusions should connect the main ideas across the full passage.'
      },
      {
        text: 'Because conclusions should ignore specific facts and stay completely general.',
        isCorrect: false,
        feedback:
          'Incorrect. Good conclusions are broad but still grounded in concrete evidence.'
      },
      {
        text: 'Because one detail can represent every person\'s activities without checking context.',
        isCorrect: false,
        feedback:
          'Incorrect. Different people and days require context-specific interpretation.'
      }
    ]
  }
];
