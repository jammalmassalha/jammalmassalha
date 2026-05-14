import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/models/cart_item.dart';
import '../../core/models/product.dart';

final cartControllerProvider = NotifierProvider<CartController, List<CartItem>>(
  CartController.new,
);

final cartCountProvider = Provider<int>((ref) {
  final cart = ref.watch(cartControllerProvider);
  return cart.fold(0, (sum, item) => sum + item.quantity);
});

class CartController extends Notifier<List<CartItem>> {
  @override
  List<CartItem> build() => [];

  void add(Product product) {
    final index = state.indexWhere((item) => item.product.id == product.id);

    if (index == -1) {
      state = [...state, CartItem(product: product, quantity: 1)];
      return;
    }

    final updated = [...state];
    updated[index] = updated[index].copyWith(quantity: updated[index].quantity + 1);
    state = updated;
  }

  void removeOne(String productId) {
    final index = state.indexWhere((item) => item.product.id == productId);
    if (index == -1) return;

    final target = state[index];
    if (target.quantity == 1) {
      state = state.where((item) => item.product.id != productId).toList(growable: false);
      return;
    }

    final updated = [...state];
    updated[index] = updated[index].copyWith(quantity: target.quantity - 1);
    state = updated;
  }

  void clear() {
    state = [];
  }
}
