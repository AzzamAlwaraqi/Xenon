// Shared image panel for authentication pages
export default function AuthImage({ image, quote, attribution }) {
  return (
    <aside className="auth-image" style={{ backgroundImage: `url(${image})` }}>
      <div className="image-quote">
        <blockquote>{quote}</blockquote>
        <small>{attribution}</small>
      </div>
    </aside>
  )
}
