

export function EmptyState({onSelectPrompt}: {onSelectPrompt: (prompt: string) => void}) {
  const examplePrompts = [
    { title: "Create a new column", prompt: "Create a new column" },
    { title: "Filter the data", prompt: "Filter the data" },
    { title: "Sort by a specific column", prompt: "Sort by a specific column" },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 py-12">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold text-white">
            What transformations would you like to apply to the data?
          </h1>
          <p className="text-lg text-gray-400">
            Describe what you want to apply to the data.
          </p>
        </div>

        {/* Example buttons */}
        <div className="flex flex-wrap gap-3 justify-center">
          {examplePrompts.map((prompt, index) => (
            <button
              key={index}
              onClick={() => {
                onSelectPrompt(prompt.prompt);
              }}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-full transition-colors duration-200 border border-gray-700 hover:border-gray-600"
            >
              {prompt.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}