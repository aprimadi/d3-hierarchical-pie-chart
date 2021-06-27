function descFn(charactersCount, linesCount) {
  return `${charactersCount} characters, ${linesCount} lines of code.`
}

var data = {
  name: "",
  description: descFn(416598, 11581),
  value: 10,
  children: [
    {
      name: "docs",
      description: descFn(14126, 374),
      value: 4,
      children: [
        {
          name: "conf-py",
          description: descFn(8906, 270),
          value: 1,
          children: [],
        },
        {
          name: "flaskdocext-py",
          description: descFn(345, 17),
          value: 3,
          children: [],
        }
      ],
    },
    {
      name: "examples",
      description: descFn(21071, 677),
      value: 6,
      children: [],
    }
  ],
}

