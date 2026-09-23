import { getImageUrl } from '../services/api';

const CategoryCard = ({
  name,
  image,
  onClick,
}: {
  name: string;
  image: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="group flex flex-col items-center gap-2 text-center shrink-0 w-24 sm:w-28"
  >
    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-tan/50 group-hover:border-oliveDark transition-colors shadow-soft">
      <img
        src={getImageUrl(image)}
        alt={name}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
      />
    </div>
    <span className="text-xs font-semibold text-ink leading-tight">{name}</span>
  </button>
);

export default CategoryCard;
