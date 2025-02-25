// src/lib/constants/tech-keywords.ts
// Map of technologies with their variations and related terms
export const TECH_MAPPING = {
    // Languages
    'JavaScript': ['javascript', 'js', 'es6', 'es2015', 'ecmascript', 'vanilla js', 'vanilla javascript'],
    'TypeScript': ['typescript', 'ts'],
    'Python': ['python', 'python2', 'python3', 'py'],
    'Java': ['java', 'java8', 'java11', 'java17', 'j2ee'],
    'C#': ['c#', 'csharp', '.net', 'dotnet', 'asp.net'],
    'C++': ['c++', 'cpp'],
    'PHP': ['php', 'php7', 'php8', 'laravel', 'symfony'],
    'Ruby': ['ruby', 'rails', 'ruby on rails', 'ror'],
    'Go': ['go', 'golang'],
    'Rust': ['rust', 'rustlang'],
    'Swift': ['swift', 'swiftui'],
    'Kotlin': ['kotlin'],
  
    // Frontend Frameworks/Libraries
    'React': ['react', 'react.js', 'reactjs', 'react native', 'next.js', 'nextjs', 'gatsby'],
    'Angular': ['angular', 'angularjs', 'angular2+', 'angular.js', 'ng'],
    'Vue': ['vue', 'vue.js', 'vuejs', 'nuxt', 'nuxt.js'],
    'Svelte': ['svelte', 'sveltekit'],
    'jQuery': ['jquery', 'jquery ui'],
    
    // Frontend Technologies
    'HTML/CSS': ['html', 'html5', 'css', 'css3', 'sass', 'scss', 'less', 'stylus', 'postcss', 'tailwind', 'bootstrap', 'material ui', 'mui'],
    'Web Components': ['web components', 'custom elements', 'shadow dom'],
    
    // Backend Frameworks
    'Node.js': ['node', 'node.js', 'nodejs', 'express', 'express.js', 'expressjs', 'nest', 'nest.js', 'nestjs'],
    'Django': ['django', 'django rest framework', 'drf'],
    'Flask': ['flask'],
    'Spring': ['spring', 'spring boot', 'spring framework', 'spring cloud'],
    'ASP.NET': ['asp.net', 'asp.net core', 'asp.net mvc'],
    'Laravel': ['laravel'],
  
    // Databases
    'SQL': ['sql', 'mysql', 'postgresql', 'postgres', 'oracle', 'sql server', 'tsql', 'plsql'],
    'MongoDB': ['mongodb', 'mongoose', 'mongo'],
    'Redis': ['redis'],
    'Elasticsearch': ['elasticsearch', 'elk'],
    'GraphQL': ['graphql', 'apollo'],
  
    // Cloud & DevOps
    'AWS': ['aws', 'amazon web services', 'ec2', 's3', 'lambda', 'cloudfront', 'route53', 'cloudwatch'],
    'Azure': ['azure', 'microsoft azure'],
    'GCP': ['gcp', 'google cloud', 'google cloud platform'],
    'Docker': ['docker', 'dockerfile', 'docker-compose'],
    'Kubernetes': ['kubernetes', 'k8s', 'kubectl'],
    'CI/CD': ['ci/cd', 'jenkins', 'github actions', 'gitlab ci', 'travis', 'circle ci'],
  
    // Testing
    'Testing': ['jest', 'mocha', 'jasmine', 'cypress', 'selenium', 'pytest', 'junit', 'testng'],
  
    // Tools & Others
    'Git': ['git', 'github', 'gitlab', 'bitbucket'],
    'Agile': ['agile', 'scrum', 'kanban', 'jira'],
    'Build Tools': ['webpack', 'babel', 'grunt', 'gulp', 'vite', 'rollup'],
    'Package Managers': ['npm', 'yarn', 'pnpm', 'pip', 'maven', 'gradle']
  } as const;
  
  // Create a map of variations to their main technology
  export const TECH_VARIATIONS = Object.entries(TECH_MAPPING).reduce((acc, [main, variations]) => {
    variations.forEach(variation => {
      acc[variation] = main;
    });
    return acc;
  }, {} as Record<string, string>);
  
  // Function to extract technologies from text
  export function extractTechStack(text: string): string[] {
    const normalizedText = ` ${text.toLowerCase()} `;  // Add spaces to help with word boundary matching
    const foundTechs = new Set<string>();
  
    Object.entries(TECH_VARIATIONS).forEach(([variation, mainTech]) => {
      // Create a regex that handles special characters and looks for word boundaries
      const escapedVariation = variation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedVariation}\\b`, 'i');
      
      if (regex.test(normalizedText)) {
        foundTechs.add(mainTech);
      }
    });
  
    return Array.from(foundTechs);
  }