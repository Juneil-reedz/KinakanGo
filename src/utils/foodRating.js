// A food's own star rating from customers' order reviews, as text for a card:
// "4.5", or "New" when nobody has rated it yet. (Not the restaurant's rating.)
export const foodRating = (item) =>
  Number(item?.rating_count) > 0 ? Number(item.avg_rating).toFixed(1) : 'New';
