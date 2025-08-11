export const EDITOR_TEXTS = {
  // Toolbar tooltips
  toolbar: {
    undo: "Undo",
    redo: "Redo",
    bold: "Bold",
    italic: "Italic",
    underline: "Underline",
    clearFormatting: "Clear formatting",
    quote: "Quote",
    superscript: "Superscript (x²)",
    subscript: "Subscript (x²)",
    insertFormula: "Insert formula",
    exportMarkdown: "Export to Markdown",
    contentGuard: "Content Guard",
  },

  // Content Guard statuses
  contentGuard: {
    buttonTitle: {
      safe: "Content is safe",
      warning: "Problematic content detected",
      analyzing: "Analyzing content...",
    },
    analyzing: "Analyzing content...",
    widgetTitle: "Content Analysis",
  },

  // Text analysis categories
  analysis: {
    categories: {
      safe: {
        label: "Safe",
        message: "Content does not contain potentially harmful information and is safe for all users.",
      },
      hateSeech: {
        label: "Hate Speech",
        message: "Content contains offensive statements that may cause emotional harm and promote discrimination.",
      },
      violence: {
        label: "Violence",
        message:
          "Content contains descriptions of violence that may traumatize readers and promote aggressive behavior.",
      },
      sexualContent: {
        label: "Adult Content",
        message: "Content contains sexual material inappropriate for minors and some audiences.",
      },
      spam: {
        label: "Spam",
        message: "Content contains intrusive advertising or fraudulent offers that may mislead users.",
      },
    },
  },

  // Math modal
  mathModal: {
    title: "Insert Equation",
    inline: "Inline",
    equation: "Equation",
    placeholder: "Enter LaTeX formula, e.g.: \\frac{1}{2} or \\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}",
    preview: "Preview",
    previewPlaceholder: "Formula preview",
    cancel: "Cancel",
    confirm: "Confirm",
  },

  // Editor footer
  footer: {
    supportsFormulas: "Supports",
    formulasLink: "LaTeX",
    charactersCount: "characters",
  },

  // Editor placeholder
  placeholder: "Start writing...",

  // Error messages
  errors: {
    formulaError: "Formula error:",
    loadingFormula: "Loading formula...",
  },
} as const

export type EditorTexts = typeof EDITOR_TEXTS
