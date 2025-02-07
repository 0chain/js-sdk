import type * as Preset from '@docusaurus/preset-classic'
import type { Config } from '@docusaurus/types'
import { themes as prismThemes } from 'prism-react-renderer'

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Züs JS SDK',
  tagline: 'Züs SDK: Simplifying JavaScript integration with the Züs Network.',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://your-org.github.io/',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/js-sdk/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: '0chain', // Usually your GitHub org/user name.
  projectName: 'js-sdk', // Usually your repo name.
  trailingSlash: false,

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  plugins: ['docusaurus-plugin-sass'],
  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: 'https://github.com/0chain/js-sdk/tree/main/docs',
        },
        // blog: {
        //   showReadingTime: true,
        //   feedOptions: {
        //     type: ['rss', 'atom'],
        //     xslt: true,
        //   },
        //   // Please change this to your repo.
        //   // Remove this to remove the "edit this page" links.
        //   editUrl: 'https://github.com/0chain/js-sdk/tree/main/docs',
        //   // Useful options to enforce blogging best practices
        //   onInlineTags: 'warn',
        //   onInlineAuthors: 'warn',
        //   onUntruncatedBlogPosts: 'warn',
        // },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      title: 'Züs JS SDK',
      logo: {
        alt: 'Züs Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Getting Started',
        },
        { href: 'https://medium.com/0chain', label: 'Blog', position: 'left' },
        {
          href: 'https://github.com/0chain/js-sdk',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'JS SDK Docs',
              to: '/docs/getting-started',
            },
            {
              label: 'Go SDK Docs',
              href: 'https://docs-old.zus.network/guides/zus-gosdk',
            },
            {
              label: 'HTTP API Reference',
              href: 'https://docs.zus.network/zus-docs/http-apis',
            },
            {
              label: 'Whitepapers',
              href: 'https://zus.network/whitepapers/?v=1',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Discord',
              href: 'https://discord.com/invite/h3BFjdtCp4',
            },
            {
              label: 'X',
              href: 'https://twitter.com/zus_network',
            },
            {
              label: 'Facebook',
              href: 'https://www.facebook.com/ZusNetwork',
            },
            {
              label: 'Linkedin',
              href: 'https://www.linkedin.com/company/zusnetwork/',
            },
            {
              label: 'Telegram',
              href: 'https://t.me/zus_network',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              href: 'https://zus.network/?v=1',
              label: 'Züs Network',
            },
            {
              href: 'https://zus.network/blog/',
              label: 'Blog',
            },
            {
              href: 'https://medium.com/0chain',
              label: 'Medium',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/0chain',
            },
            {
              label: 'YouTube',
              href: 'https://www.youtube.com/@Zus_Network',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Züs. All Rights Reserved.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
}

export default config
