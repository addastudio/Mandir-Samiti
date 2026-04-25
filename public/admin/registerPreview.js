/**
 * Decap CMS Preview Registration
 * This script registers React components to preview content in the CMS.
 */

const h = window.react.createElement;

// Page Preview Template
const PagePreview = ({ entry, widgetFor }) => {
  const data = entry.getIn(['data']).toJS();
  
  return h('div', { className: 'preview-container p-8 font-sans' },
    h('h1', { className: 'text-3xl font-bold text-orange-600 mb-4' }, 'Page Preview'),
    h('div', { className: 'border-t pt-4' },
      h('h2', { className: 'text-xl font-bold underline' }, 'Hindi Version'),
      h('h3', { className: 'font-bold mt-2' }, data.history_title_hi || data.title_hi),
      widgetFor('history_hi') || widgetFor('body_hi'),
      h('h2', { className: 'text-xl font-bold underline mt-8' }, 'English Version'),
      h('h3', { className: 'font-bold mt-2' }, data.history_title_en || data.title_en),
      widgetFor('history_en') || widgetFor('body_en')
    )
  );
};

// Post Preview Template
const PostPreview = ({ entry, widgetFor }) => {
  const data = entry.getIn(['data']).toJS();
  return h('div', { className: 'p-8' },
    h('div', { className: 'bg-orange-50 p-6 rounded-xl border-l-4 border-orange-500' },
      h('h2', { className: 'text-2xl font-bold' }, data.title_en || 'Untitled Post'),
      h('p', { className: 'text-sm text-gray-500' }, data.date ? new Date(data.date).toDateString() : ''),
      h('div', { className: 'mt-4 prose' }, widgetFor('body_en'))
    ),
    h('div', { className: 'mt-8 bg-orange-50 p-6 rounded-xl border-l-4 border-orange-500' },
      h('h2', { className: 'text-2xl font-bold' }, data.title_hi || 'बिना शीर्षक'),
      h('div', { className: 'mt-4 prose' }, widgetFor('body_hi'))
    )
  );
};

CMS.registerPreviewTemplate('pages', PagePreview);
CMS.registerPreviewTemplate('notices', PostPreview);
CMS.registerPreviewTemplate('events', PostPreview);

// Import Tailwind for previews if needed
CMS.registerPreviewStyle('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');
