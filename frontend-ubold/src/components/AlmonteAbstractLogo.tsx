const AlmonteAbstractLogo = ({ height = 60 }: { height?: number }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      width={height}
      height={height}
      style={{ display: 'block' }}
    >
      {/* Left black shape (parallelogram) */}
      <path
        d="M20 20 L80 20 L60 100 L20 100 Z"
        fill="black"
      />
      {/* Right black shape (complex shape with curves) */}
      <path
        d="M120 20 L180 20 L180 100 Q160 80 140 100 L120 20 Z"
        fill="black"
      />
      {/* Additional geometric elements to create the abstract A shape */}
      <path
        d="M40 120 L100 120 L80 200 L40 200 Z"
        fill="black"
      />
      <path
        d="M120 120 L180 120 L180 200 L140 200 L120 120 Z"
        fill="black"
      />
    </svg>
  )
}

export default AlmonteAbstractLogo

