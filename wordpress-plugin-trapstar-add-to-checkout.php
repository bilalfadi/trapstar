<?php
/**
 * Plugin Name: Trapstar Add to Cart & Checkout
 * Description: Pura WooCommerce fix – Pending payment allow, add-to-cart redirect, add_and_checkout. functions.php me kuch add mat karo.
 * Version: 1.2
 * Author: Trapstar
 * Requires at least: 5.0
 * Requires PHP: 7.2
 *
 * Install: Is file ko wp-content/plugins/ me upload karo (ya folder "trapstar-add-to-checkout" bana ke andar ye file rakh ke zip karo).
 * Phir Plugins → Trapstar Add to Cart & Checkout → Activate.
 * Sirf is plugin se kaam chalega – functions.php me koi code add nahi karna.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// ─── 1) "Pending payment—it cannot be paid for" fix (order-pay page) ─────────────────
// WooCommerce order-pay pe $order->needs_payment() check karta hai. Pending/failed hamesha allow.
add_filter( 'woocommerce_valid_order_statuses_for_payment', function( $statuses ) {
    $required = array( 'pending', 'failed' );
    foreach ( $required as $s ) {
        if ( ! in_array( $s, $statuses, true ) ) {
            $statuses[] = $s;
        }
    }
    return $statuses;
}, 999, 1 );

// Force needs_payment() = true for pending/failed (total 0 ya koi plugin block kare to bhi payment form dikhe).
add_filter( 'woocommerce_order_needs_payment', function( $needs_payment, $order, $valid_statuses ) {
    if ( ! $order || ! is_callable( array( $order, 'get_status' ) ) ) {
        return $needs_payment;
    }
    if ( in_array( $order->get_status(), array( 'pending', 'failed' ), true ) ) {
        return true;
    }
    return $needs_payment;
}, 999, 3 );

// ─── 2) Add to cart ke baad seedha checkout pe redirect ───────────────────────────
add_filter( 'woocommerce_add_to_cart_redirect', function( $url ) {
    return wc_get_checkout_url();
}, 10, 1 );

// ─── 3) ?product_id=123&add_and_checkout=1 – product cart me add, phir checkout ───
add_action( 'wp', function() {
    if ( ! isset( $_GET['add_and_checkout'] ) || ! isset( $_GET['product_id'] ) ) {
        return;
    }
    $product_id = absint( $_GET['product_id'] );
    if ( ! $product_id ) {
        wp_safe_redirect( wc_get_checkout_url() );
        exit;
    }
    if ( ! function_exists( 'WC' ) || ! WC()->cart ) {
        wp_safe_redirect( wc_get_checkout_url() );
        exit;
    }
    $qty = isset( $_GET['quantity'] ) ? absint( $_GET['quantity'] ) : 1;
    WC()->cart->add_to_cart( $product_id, $qty );
    wp_safe_redirect( wc_get_checkout_url() );
    exit;
}, 5 );
