export const questions = [
  {
    id: 'q1',
    type: 'mcq',
    question:
      'Which statement best distinguishes type declaration from type assertion in TypeScript?',
    options: [
      {
        text: 'Type declaration sets an explicit type contract; type assertion tells TypeScript to trust your chosen type.',
        isCorrect: true,
        feedback:
          'Correct. Declarations define constraints up front, while assertions override checker assumptions without proving runtime truth.'
      },
      {
        text: 'Type declaration changes runtime values; type assertion creates a new object copy with that type.',
        isCorrect: false,
        feedback:
          'Incorrect. Neither operation transforms runtime data automatically; both are compile-time typing constructs.'
      },
      {
        text: 'Type declaration is optional metadata only; type assertion is required for all function calls.',
        isCorrect: false,
        feedback:
          'Incorrect. Declarations are often central to safety, and assertions are not required in normal function calls.'
      },
      {
        text: 'Type declaration works only with primitives, while type assertion works only with objects.',
        isCorrect: false,
        feedback:
          'Incorrect. Both can apply to many kinds of values, including primitives, objects, unions, and generics.'
      }
    ],
    hint: 'Think about "enforce" versus "trust me" semantics.',
    requiresWhy: true,
    whyQuestion: 'Why is type assertion often described as "I know better than the compiler"?',
    whyOptions: [
      {
        text: 'Because assertion can bypass normal inference checks and force a chosen static type view.',
        isCorrect: true,
        feedback:
          'Correct. Assertions suppress some checker caution, so you assume responsibility for correctness.'
      },
      {
        text: 'Because assertion performs a runtime validator that guarantees the value shape.',
        isCorrect: false,
        feedback:
          'Incorrect. Assertion does not run runtime validation; it only changes compile-time interpretation.'
      },
      {
        text: 'Because assertion automatically narrows every union safely in all branches.',
        isCorrect: false,
        feedback:
          'Incorrect. Safe narrowing usually comes from control-flow analysis or explicit guards, not blanket assertion.'
      }
    ]
  },
  {
    id: 'q2',
    type: 'mcq',
    question:
      'What is the core idea of a generic type parameter like `U` in `reduce<U>(...)`?',
    options: [
      {
        text: 'It delays concrete type choice with a placeholder that is later inferred or provided at use time.',
        isCorrect: true,
        feedback:
          'Correct. `U` is a type variable that becomes a real type when the function is called.'
      },
      {
        text: 'It means the function accepts only unknown values and cannot return typed output.',
        isCorrect: false,
        feedback:
          'Incorrect. Generics preserve type information; they do not erase output typing.'
      },
      {
        text: 'It forces all inputs and outputs to be the same primitive type.',
        isCorrect: false,
        feedback:
          'Incorrect. Generics can relate types flexibly; they are not limited to one primitive.'
      },
      {
        text: 'It is a runtime placeholder that JavaScript resolves during execution.',
        isCorrect: false,
        feedback:
          'Incorrect. Generic parameters are compile-time type-system constructs, not runtime entities.'
      }
    ],
    hint: 'Focus on when the concrete type is chosen.',
    requiresWhy: true,
    whyQuestion: 'Why can `reduce<string>(...)` improve clarity in some cases?',
    whyOptions: [
      {
        text: 'Because it explicitly fixes the accumulator type when inference may be ambiguous.',
        isCorrect: true,
        feedback:
          'Correct. Supplying `<string>` (or another type) removes uncertainty and makes intent explicit.'
      },
      {
        text: 'Because explicit generics make code run faster by skipping callbacks.',
        isCorrect: false,
        feedback:
          'Incorrect. Generic annotations affect type checking, not callback execution behavior.'
      },
      {
        text: 'Because generic annotations are required whenever arrays contain strings.',
        isCorrect: false,
        feedback:
          'Incorrect. Type inference often works without explicit generic arguments for string arrays.'
      }
    ]
  },
  {
    id: 'q3',
    type: 'mcq',
    question:
      'In `reduce<U>(callback: (acc: U, current: T) => U, initialValue: U): U`, what does `U` represent?',
    options: [
      {
        text: 'The element type of the input array only.',
        isCorrect: false,
        feedback:
          'Incorrect. The element type is typically `T`; `U` describes accumulator and return types.'
      },
      {
        text: 'The callback function type itself.',
        isCorrect: false,
        feedback:
          'Incorrect. `U` is not the function type; it is the accumulator/result type parameter.'
      },
      {
        text: 'The accumulator type and final return type of reduce.',
        isCorrect: true,
        feedback:
          'Correct. The accumulator starts as `U`, updates as `U`, and reduce returns `U`.'
      },
      {
        text: 'A required runtime class used to create new accumulator instances.',
        isCorrect: false,
        feedback:
          'Incorrect. `U` is compile-time typing metadata, not a runtime constructor.'
      }
    ],
    hint: 'Track where `U` appears in the signature.',
    requiresWhy: true,
    whyQuestion: 'Why is this design useful for reduce?',
    whyOptions: [
      {
        text: 'Because it allows the accumulator/result type to differ from the array element type while staying type-safe.',
        isCorrect: true,
        feedback:
          'Correct. You can reduce `T[]` into objects, numbers, strings, maps, and more with checked consistency.'
      },
      {
        text: 'Because reduce only works when `U` equals `T` exactly.',
        isCorrect: false,
        feedback:
          'Incorrect. A major benefit is that `U` can be different from `T`.'
      },
      {
        text: 'Because `U` prevents callbacks from returning values.',
        isCorrect: false,
        feedback:
          'Incorrect. The callback must return a new accumulator value of type `U` each step.'
      }
    ]
  },
  {
    id: 'q4',
    type: 'mcq',
    question:
      'Code reading: in a frequency-count reduce initialized with `{}`, why does TypeScript often need extra typing help?',
    options: [
      {
        text: 'Because `{}` is a vague composite type and does not describe expected indexed value types by itself.',
        isCorrect: true,
        feedback:
          'Correct. An untyped empty object gives weak information, so accumulator property access can become unsafe or unclear.'
      },
      {
        text: 'Because reduce cannot be used with object accumulators at all.',
        isCorrect: false,
        feedback:
          'Incorrect. Object accumulators are common; they just need an explicit type shape when inference is insufficient.'
      },
      {
        text: 'Because callbacks in reduce must mutate arrays only, not objects.',
        isCorrect: false,
        feedback:
          'Incorrect. Reduce can return any accumulator type, including objects.'
      },
      {
        text: 'Because TypeScript forbids ternary expressions inside reduce callbacks.',
        isCorrect: false,
        feedback:
          'Incorrect. Ternary expressions are valid; the issue is type precision, not syntax.'
      }
    ],
    hint: 'Compare an empty object literal to a concrete numeric initial value.',
    requiresWhy: true,
    whyQuestion:
      'Why does inference usually work smoothly when the initial reduce value is an atomic type like `0`?',
    whyOptions: [
      {
        text: 'Because atomic literals provide a concrete accumulator type immediately, leaving little ambiguity.',
        isCorrect: true,
        feedback:
          'Correct. A numeric initializer directly anchors `U` as number, so callback checks become straightforward.'
      },
      {
        text: 'Because atomic types disable TypeScript strict mode for reduce callbacks.',
        isCorrect: false,
        feedback:
          'Incorrect. Strictness settings are unchanged; the improvement comes from clearer type inference inputs.'
      },
      {
        text: 'Because atomic initializers are converted to objects internally before reduce runs.',
        isCorrect: false,
        feedback:
          'Incorrect. Primitive initializers stay primitive unless your callback returns a different type.'
      }
    ]
  },
  {
    id: 'q5',
    type: 'mcq',
    question:
      'Which fix best preserves type safety for this pattern: `values.reduce((acc, current) => { ... }, {})` when building a frequency map?',
    options: [
      {
        text: 'Use an explicit accumulator type such as `values.reduce<Record<string, number>>(..., {})`.',
        isCorrect: true,
        feedback:
          'Correct. Providing a concrete map shape tells TypeScript what keys/values are expected in the accumulator.'
      },
      {
        text: 'Cast everything to `any` once inside callback and keep `{}` untyped.',
        isCorrect: false,
        feedback:
          'Incorrect. This silences errors but removes useful guarantees and can hide real bugs.'
      },
      {
        text: 'Remove the initial value entirely so TypeScript can infer an object map automatically.',
        isCorrect: false,
        feedback:
          'Incorrect. Omitting the initial value changes reduce semantics and often infers from array element type, not your map shape.'
      },
      {
        text: 'Switch to `as never` assertion on the result to force compatibility.',
        isCorrect: false,
        feedback:
          'Incorrect. Forcing `never` is unsound and does not model the real accumulator structure.'
      }
    ],
    hint: 'Look for the option that describes key and value types explicitly.',
    requiresWhy: true,
    whyQuestion: 'Why is this approach better than broad `any` assertions?',
    whyOptions: [
      {
        text: 'Because it keeps compile-time checks for both key access and numeric updates instead of disabling safety.',
        isCorrect: true,
        feedback:
          'Correct. You keep useful diagnostics while expressing the intended data structure clearly.'
      },
      {
        text: 'Because `any` is stricter than generic object typing in TypeScript.',
        isCorrect: false,
        feedback:
          'Incorrect. `any` is less strict and bypasses most type checking.'
      },
      {
        text: 'Because explicit generic types automatically validate runtime input data.',
        isCorrect: false,
        feedback:
          'Incorrect. Static typing improves compile-time guarantees but does not replace runtime validation when needed.'
      }
    ]
  },
  {
    id: 'q6',
    type: 'mcq',
    question:
      'Which statement is most accurate about type inference and data shape from your notes?',
    options: [
      {
        text: 'Inference is impossible unless every variable has an explicit annotation.',
        isCorrect: false,
        feedback:
          'Incorrect. TypeScript infers many types automatically from concrete values and usage context.'
      },
      {
        text: 'Inference tends to be straightforward for precise atomic initial values, but may be too vague for empty composite literals like `{}`.',
        isCorrect: true,
        feedback:
          'Correct. Ambiguous composite literals often require extra type information to represent internal structure.'
      },
      {
        text: 'Composite types are always inferred more accurately than primitives.',
        isCorrect: false,
        feedback:
          'Incorrect. Composite inference depends on available structure; empty object literals provide little detail.'
      },
      {
        text: 'If inference fails once, TypeScript cannot infer any type in the file.',
        isCorrect: false,
        feedback:
          'Incorrect. Inference is local/contextual and does not globally disable for a whole file.'
      }
    ],
    hint: 'Evaluate how much information the initial value actually gives the compiler.',
    requiresWhy: true,
    whyQuestion:
      'Why is an empty object literal a common edge case for inference in accumulator patterns?',
    whyOptions: [
      {
        text: 'Because it starts with no declared keys or value constraints, so intended structure is under-specified.',
        isCorrect: true,
        feedback:
          'Correct. Without explicit typing or richer initializer data, TypeScript cannot fully infer the eventual object schema.'
      },
      {
        text: 'Because object literals cannot be typed in TypeScript at all.',
        isCorrect: false,
        feedback:
          'Incorrect. Object literals are typable; the problem is missing detail in this specific empty literal case.'
      },
      {
        text: 'Because reduce callbacks ignore the type of `initialValue` entirely.',
        isCorrect: false,
        feedback:
          'Incorrect. The initializer strongly influences accumulator typing and callback expectations.'
      }
    ]
  },
  {
    id: 'q7',
    type: 'mcq',
    question:
      'Your notes say prompt engineering improves when you know the domain basics. Which example applies that correctly?',
    options: [
      {
        text: 'Ask for "a cool 3D animation" with no domain terms, expecting consistent technical output.',
        isCorrect: false,
        feedback:
          'Incorrect. Vague prompts give broad interpretations and reduce control over specialized output quality.'
      },
      {
        text: 'Use domain keywords like rigging, keyframes, and easing when requesting an animation workflow.',
        isCorrect: true,
        feedback:
          'Correct. Domain vocabulary narrows search space and guides the model toward relevant conventions.'
      },
      {
        text: 'Avoid all domain context so the AI can decide the best field on its own.',
        isCorrect: false,
        feedback:
          'Incorrect. Removing context weakens alignment with your intended task and constraints.'
      },
      {
        text: 'Only specify output length; domain details are unnecessary for technical tasks.',
        isCorrect: false,
        feedback:
          'Incorrect. Length constraints help formatting, but domain cues drive technical correctness and relevance.'
      }
    ],
    hint: 'Which option best narrows the model with field-specific language?',
    requiresWhy: true,
    whyQuestion:
      'Why do domain keywords usually improve prompt results for specialized work?',
    whyOptions: [
      {
        text: 'Because they constrain interpretation toward the right technical concepts, reducing generic responses.',
        isCorrect: true,
        feedback:
          'Correct. Better context leads to more targeted reasoning and fewer off-domain assumptions.'
      },
      {
        text: 'Because keywords force the model to skip reasoning and copy fixed templates.',
        isCorrect: false,
        feedback:
          'Incorrect. Keywords guide reasoning; they do not inherently disable it.'
      },
      {
        text: 'Because domain keywords guarantee factual correctness without verification.',
        isCorrect: false,
        feedback:
          'Incorrect. They improve relevance but do not guarantee correctness on their own.'
      }
    ]
  },
  {
    id: 'q8',
    type: 'mcq',
    question:
      'According to your notes, what is Valgrind mainly used for?',
    options: [
      {
        text: 'Finding Linux memory issues such as leaks by tracking allocations versus frees.',
        isCorrect: true,
        feedback:
          'Correct. Valgrind is commonly used to detect memory misuse patterns, including leaks and invalid memory operations.'
      },
      {
        text: 'Compiling C programs into faster machine code automatically.',
        isCorrect: false,
        feedback:
          'Incorrect. Compilation/optimization is handled by compilers, not by Valgrind.'
      },
      {
        text: 'Replacing unit tests by proving all branches are correct.',
        isCorrect: false,
        feedback:
          'Incorrect. Valgrind helps runtime memory diagnostics, not full logical correctness proofs.'
      },
      {
        text: 'Encrypting process memory to prevent leaks.',
        isCorrect: false,
        feedback:
          'Incorrect. It analyzes memory behavior; it does not perform encryption as a leak fix.'
      }
    ],
    hint: 'Focus on diagnostics, not compilation or scheduling.',
    requiresWhy: true,
    whyQuestion:
      'Why does repeated allocation without corresponding release typically indicate a leak?',
    whyOptions: [
      {
        text: 'Because retained allocations accumulate across executions and unavailable memory keeps growing.',
        isCorrect: true,
        feedback:
          'Correct. If memory is never returned, footprint can increase over time and degrade stability.'
      },
      {
        text: 'Because modern systems instantly recycle all memory before function return, so no leak is possible.',
        isCorrect: false,
        feedback:
          'Incorrect. Automatic recycling does not occur for every allocation pattern during process lifetime.'
      },
      {
        text: 'Because leaking memory only affects source formatting, not runtime behavior.',
        isCorrect: false,
        feedback:
          'Incorrect. Memory leaks are runtime resource issues that can cause slowdowns or crashes.'
      }
    ]
  },
  {
    id: 'q9',
    type: 'mcq',
    question:
      'Debugging scenario: a function allocates memory each call and never frees it. What is the most direct risk over long runs?',
    options: [
      {
        text: 'Memory usage grows over time, increasing chances of slowdown or out-of-memory failures.',
        isCorrect: true,
        feedback:
          'Correct. Unreleased allocations accumulate, which can gradually exhaust available memory.'
      },
      {
        text: 'TypeScript compile time increases, but runtime memory stays constant.',
        isCorrect: false,
        feedback:
          'Incorrect. The primary consequence is runtime memory growth, not TypeScript compile duration.'
      },
      {
        text: 'The OS automatically converts leaks into stack memory, so stability improves.',
        isCorrect: false,
        feedback:
          'Incorrect. There is no such conversion mechanism that turns leaks into a stability benefit.'
      },
      {
        text: 'Only one extra allocation is kept forever regardless of call count.',
        isCorrect: false,
        feedback:
          'Incorrect. Repeated calls can retain many allocations, so impact can scale with usage.'
      }
    ],
    hint: 'Consider the per-call effect multiplied by many calls.',
    requiresWhy: true,
    whyQuestion: 'Why would Valgrind be useful in this situation?',
    whyOptions: [
      {
        text: 'Because it can report unfreed allocations and help trace where memory is not released.',
        isCorrect: true,
        feedback:
          'Correct. Leak reports tie allocations to code paths so you can identify and fix missing deallocation.'
      },
      {
        text: 'Because it rewrites source code automatically to insert `free` everywhere.',
        isCorrect: false,
        feedback:
          'Incorrect. Valgrind reports issues; developers still apply the code fixes.'
      },
      {
        text: 'Because it guarantees zero memory bugs after one run.',
        isCorrect: false,
        feedback:
          'Incorrect. It is a strong diagnostic tool, but no single run guarantees complete absence of memory issues.'
      }
    ]
  },
  {
    id: 'q10',
    type: 'mcq',
    question:
      'Which combined statement reflects both TypeScript and memory-debugging ideas from your notes?',
    options: [
      {
        text: 'Type assertion proves runtime object shape, and Valgrind is mainly for compile-time type checking.',
        isCorrect: false,
        feedback:
          'Incorrect. Assertion is static trust, not runtime proof, and Valgrind targets runtime memory behavior.'
      },
      {
        text: 'Type annotations/assertions guide compile-time checks, while tools like Valgrind inspect runtime memory correctness.',
        isCorrect: true,
        feedback:
          'Correct. This separates static type design from runtime resource diagnostics, which solve different classes of problems.'
      },
      {
        text: 'If reduce uses generics, memory leaks become impossible in native code.',
        isCorrect: false,
        feedback:
          'Incorrect. Generic typing does not prevent low-level allocation mistakes in non-garbage-collected contexts.'
      },
      {
        text: 'Prompt engineering removes the need for typing and memory tools in software projects.',
        isCorrect: false,
        feedback:
          'Incorrect. Prompting can improve guidance, but engineering still requires static typing and runtime diagnostics.'
      }
    ],
    hint: 'Separate compile-time guarantees from runtime diagnostics.',
    requiresWhy: true,
    whyQuestion: 'Why is this distinction important when debugging real systems?',
    whyOptions: [
      {
        text: 'Because static types and runtime analyzers catch different failure modes, so both perspectives are necessary.',
        isCorrect: true,
        feedback:
          'Correct. Type errors and memory leaks can coexist, and each requires the right diagnostic layer.'
      },
      {
        text: 'Because once TypeScript compiles, runtime tools never provide additional value.',
        isCorrect: false,
        feedback:
          'Incorrect. Successful compilation does not guarantee runtime memory safety or behavior correctness.'
      },
      {
        text: 'Because runtime analyzers can infer all generic types without source code.',
        isCorrect: false,
        feedback:
          'Incorrect. Runtime memory tools do not replace source-level static type analysis.'
      }
    ]
  }
];
