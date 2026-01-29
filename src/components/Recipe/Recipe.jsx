import ReactMarkdown from "react-markdown";

export default function KitzRecipe(props) {
  return (
    <section>
      <ReactMarkdown>{props.recipe}</ReactMarkdown>
    </section>
  );
}
