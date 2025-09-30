# Smart Transformations

🌐 **Live Demo**: [smart-transformations.alvarezcristian.com](https://smart-transformations.alvarezcristian.com)

<img src="docs/imgs/trailer.gif" alt="Trailer" width="900" height="506" />


## Description

Smart Transformations is an AI-powered data analysis platform that allows users to upload CSV files and interact with their data through natural language conversations. The application provides an intuitive interface for data exploration, transformation, and analysis without requiring complex SQL queries or programming knowledge.

Key features include:
- **CSV File Upload**: Drag-and-drop interface for easy CSV file uploads with validation
- **AI-Powered Chat**: Natural language interface to query and analyze your data
- **Real-time Data Processing**: Instant processing and storage using PGLite (local SQLite database)
- **Interactive Data Preview**: Visual table preview of your datasets
- **Persistent Workspaces**: Each dataset gets its own workspace with chat history
- **Versioning**: Each transformation is saved as a new version of the dataset
- **Data Transformation Tools**: Built-in tools for data manipulation and analysis

The application is perfect for data analysts, researchers, and anyone who needs to quickly explore and understand their CSV data through conversational AI.

## Tech Stack

### Frontend/Backend Framework
- **[Next.js 15.5.3](https://nextjs.org)** - React framework with app router
- **[React 19.1.0](https://reactjs.org)** - UI library
- **[TypeScript](https://www.typescriptlang.org)** - Static type checking

### UI & Styling
- **[Tailwind CSS 4](https://tailwindcss.com)** - Utility-first CSS framework
- **[Shadcn UI](https://ui.shadcn.com)** - Headless UI components
- **[Lucide React](https://lucide.dev)** - Icon library

### AI & Chat
- **[AI SDK](https://sdk.vercel.ai)** - Vercel AI SDK for chat interfaces

### Data Management
- **[PGLite](https://pglite.dev)** - Local PostgreSQL database in the browser
- **[TanStack Query](https://tanstack.com/query)** - Data fetching and caching
- **[Papa Parse](https://www.papaparse.com)** - CSV parsing library

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   # OpenAI API Key for AI chat functionality
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```
