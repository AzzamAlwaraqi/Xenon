// Initial brand animation
export default function LoadingScreen() {
  return (
    <div className="loading-screen" role="status" aria-label="Loading Xenon">
      <div className="loading-mark">
        <span className="loading-orbit" />
        <span className="loading-orbit loading-orbit-two" />
        <span className="loading-x">X</span>
      </div>
      <div className="loading-word">Xenon</div>
      <p>Curating your journey</p>
    </div>
  )
}
