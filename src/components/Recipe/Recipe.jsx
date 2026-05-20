import ReactMarkdown from "react-markdown";

export default function KitzRecipe(props) {
  return (
    <section className="recipe-markdown">
      <ReactMarkdown>{props.recipe}</ReactMarkdown>
    </section>
  );
}
