import { restaurantRequest } from '../../context/RestaurantContext';
import RiderPayBoard from '../../components/RiderPayBoard';

export default function RestaurantRiderPay() {
  return (
    <div className="space-y-5 animate-fade-up">
      <div>
        <p className="text-forest-200/50 text-sm">Riders</p>
        <h1 className="text-2xl font-heading font-bold text-white">Rider Pay</h1>
        <p className="text-forest-200/60 text-sm mt-1 max-w-2xl">
          After each delivery, this updates on its own. For a GCash order you owe the rider the delivery fee.
          For a cash order the rider collected the money, keeps the fee and owes you the rest.
          Send what you owe by GCash and tap "I paid"; tap "I got it" when a rider pays you.
        </p>
      </div>
      <RiderPayBoard side="restaurant" request={restaurantRequest} />
    </div>
  );
}
