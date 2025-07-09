# Google Calendar MCP Website

A modern, responsive website for the Google Calendar MCP project built with Next.js 15, Tailwind CSS, and Radix UI.

## Features

- **Modern Design**: Inspired by Stripe and Mercury with Google Calendar branding
- **Responsive**: Mobile-first design that works on all devices
- **Fast**: Built with Next.js 15 and optimized for performance
- **Accessible**: Uses Radix UI primitives for accessibility
- **Type Safe**: Full TypeScript support

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Homepage
│   ├── privacy/        # Privacy policy page
│   └── terms/          # Terms of service page
├── components/         # Reusable components
│   ├── ui/            # UI primitives (buttons, separators, etc.)
│   └── footer.tsx     # Footer navigation component
└── lib/               # Utility functions
    └── utils.ts       # Tailwind utility functions
```

## Design System

### Colors

The website uses a modern color palette inspired by Google Calendar and professional SaaS platforms:

- **Primary**: Google Blue (#4285f4)
- **Accent**: Google Red (#ea4335)
- **Supporting**: Google Yellow (#fbbc04), Google Green (#34a853)
- **Neutrals**: Professional grays for text and backgrounds

### Typography

- **Primary Font**: Inter (modern, readable sans-serif)
- **Monospace Font**: JetBrains Mono (for code snippets)

### Components

Built with Radix UI primitives for:
- Buttons with multiple variants
- Navigation menus
- Separators
- Responsive layout components

## Pages

### Homepage (/)
- Hero section with compelling value proposition
- Feature showcase highlighting calendar integration capabilities
- Natural language examples
- Call-to-action sections

### Privacy Policy (/privacy)
- Comprehensive privacy documentation for open source project
- Details on data handling and Google API integration
- Transparency about local-only operation

### Terms of Service (/terms)
- Legal terms for open source software
- MIT license information
- Usage guidelines and limitations

## Development

### Adding New Pages

1. Create a new directory in `src/app/`
2. Add a `page.tsx` file with your component
3. Update navigation if needed

### Styling

The project uses Tailwind CSS with a custom design system. Colors and spacing are defined in `globals.css` and available as Tailwind utilities.

### Components

UI components follow the shadcn/ui pattern with Radix UI primitives and class-variance-authority for styling variants.

## Deployment

The website is optimized for static deployment and can be deployed to:
- Vercel (recommended for Next.js)
- Netlify
- GitHub Pages
- Any static hosting provider

Build outputs static files that can be served from any web server.

## License

This website is part of the Google Calendar MCP project and is licensed under the MIT License.
