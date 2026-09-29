export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  image: string;
  content: string[];
}

export const POSTS: BlogPost[] = [
  {
    slug: "write-a-resume-that-gets-noticed",
    title: "How to write a resume that gets noticed",
    excerpt:
      "Recruiters skim. Here is how to make your first ten seconds count.",
    category: "Career tips",
    date: "September 12, 2026",
    readTime: "4 min read",
    image: "/uploads/blog-1.jpg",
    content: [
      "Most hiring managers spend only a few seconds on a first pass, so your resume has to make its case fast. Put your strongest, most relevant experience near the top and keep the layout clean, with clear headings and generous spacing.",
      "Replace vague duties with results. Instead of 'responsible for social media', write 'grew followers by 40% in six months'. Numbers, even rough ones, show the impact you had rather than the tasks you were given.",
      "Finally, tailor each version to the job you are applying for. Mirror the language in the posting where it is honest to do so, and save the file as a PDF so your formatting survives on every device.",
    ],
  },
  {
    slug: "five-questions-to-ask-in-an-interview",
    title: "5 questions to ask at the end of an interview",
    excerpt:
      "The questions you ask say as much about you as the answers you give.",
    category: "Interviews",
    date: "August 30, 2026",
    readTime: "3 min read",
    image: "/uploads/blog-2.jpg",
    content: [
      "When an interviewer asks whether you have any questions, 'no' is a missed chance. Good questions show that you have thought about the role and that you are deciding whether it is right for you too.",
      "Try asking what success looks like in the first six months, how the team gives feedback, what the biggest challenge for the role is right now, how the company supports learning, and what the next steps in the process are.",
      "Write your questions down beforehand and choose the ones the conversation has not already answered. It is fine to look at your notes; it shows you prepared.",
    ],
  },
  {
    slug: "write-a-job-post-that-attracts-the-right-people",
    title: "Writing a job post that attracts the right people",
    excerpt:
      "Clear, honest job posts save time for you and for every candidate.",
    category: "For employers",
    date: "August 14, 2026",
    readTime: "5 min read",
    image: "/uploads/blog-3.jpg",
    content: [
      "A strong job post starts with a specific title. 'Frontend Developer' tells candidates far more than 'Rockstar Ninja'. Say what the person will actually do in the first months, not just a list of buzzwords.",
      "Separate what is required from what is nice to have. Long lists of must-haves discourage capable people from applying, so keep the essentials short and be honest about where you are flexible.",
      "Include the location, job type and salary range if you can. Candidates trust posts that share the basics up front, and you will spend less time on applications that were never going to fit.",
    ],
  },
  {
    slug: "making-remote-work-actually-work",
    title: "Making remote work actually work",
    excerpt: "Small habits that keep remote roles productive and sane.",
    category: "Workplace",
    date: "July 29, 2026",
    readTime: "4 min read",
    image: "/uploads/blog-4.jpg",
    content: [
      "Working from home sounds simple until the boundaries blur. A fixed start and finish time, and a spot in your home that is only for work, make it easier to switch off at the end of the day.",
      "Communicate more than feels necessary. Share progress in writing, say when you are stuck, and confirm decisions in a message so nobody has to guess what was agreed.",
      "Plan breaks and some face-to-face time, even if it is a weekly call with a colleague. Remote roles work best when people feel connected to the team, not just to their task list.",
    ],
  },
];
