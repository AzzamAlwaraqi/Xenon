import 'dart:async';
import 'package:gp/models/destination_model.dart';

class DestinationService {
  Future<List<Destination>> getDestinations() async {
    // Simulate network delay
    await Future.delayed(const Duration(seconds: 1));

    return [
      Destination(
        id: '1',
        title: 'The Treasury at Petra',
        category: 'HISTORICAL',
        price: '50',
        rating: '4.9',
        imageUrl:
            'https://images.unsplash.com/photo-1547234935-80c7145ec969?q=80&w=1000&auto=format&fit=crop',
      ),
      Destination(
        id: '2',
        title: 'Wadi Rum Desert Camp',
        category: 'ADVENTURE',
        price: '120',
        rating: '4.8',
        imageUrl:
            'https://images.unsplash.com/photo-1548691905-57c36cc8d935?q=80&w=1000&auto=format&fit=crop',
      ),
      Destination(
        id: '3',
        title: 'Dead Sea Resort',
        category: 'WELLNESS',
        price: '200',
        rating: '4.7',
        imageUrl:
            'https://images.unsplash.com/photo-1582650816738-1f637b587da4?q=80&w=1000&auto=format&fit=crop',
      ),
    ];
  }
}
