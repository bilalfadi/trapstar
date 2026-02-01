<?php
/**
 * Plugin Name: Trapstar Order Pay Page Style
 * Description: "Pay for order" page ko clean aur acha dikhata hai – dark theme, clear layout, Trapstar style.
 * Version: 1.5
 * Author: Trapstar
 * Requires at least: 5.0
 * Requires PHP: 7.2
 *
 * Install: Is file ko wp-content/plugins/ me upload karo. Plugins → Trapstar Order Pay Page Style → Activate.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

add_action( 'wp_enqueue_scripts', 'trapstar_order_pay_style_assets', 999 );

function trapstar_order_pay_style_assets() {
    if ( ! function_exists( 'is_wc_endpoint_url' ) || ! is_wc_endpoint_url( 'order-pay' ) ) {
        return;
    }
    $css = trapstar_order_pay_get_css();
    wp_register_style( 'trapstar-order-pay-style', false, array(), '1.5' );
    wp_enqueue_style( 'trapstar-order-pay-style' );
    wp_add_inline_style( 'trapstar-order-pay-style', $css );
}

add_filter( 'body_class', 'trapstar_order_pay_body_class' );

// Page / browser tab pe "My Blog" ki jagah apna site name – Pay for order – Trapstar Official
add_filter( 'document_title_parts', 'trapstar_order_pay_document_title', 10, 1 );
function trapstar_order_pay_document_title( $title ) {
    if ( ! function_exists( 'is_wc_endpoint_url' ) || ! is_wc_endpoint_url( 'order-pay' ) ) {
        return $title;
    }
    $site_name = 'Trapstar Official Store';
    $title['title'] = __( 'Pay for order', 'woocommerce' );
    $title['site']  = $site_name;
    return $title;
}

function trapstar_order_pay_body_class( $classes ) {
    if ( ! function_exists( 'is_wc_endpoint_url' ) || ! is_wc_endpoint_url( 'order-pay' ) ) {
        return $classes;
    }
    $classes[] = 'trapstar-order-pay-page';
    return $classes;
}

function trapstar_order_pay_get_css() {
    return '
    /* Sirf: Pay for order wala box upar, baaki niche. Style/structure theme ka. Color sahi. */
    body.trapstar-order-pay-page .woocommerce form,
    body.trapstar-order-pay-page form#order_review,
    body.trapstar-order-pay-page form.woocommerce-pay {
        display: flex !important;
        flex-direction: column !important;
    }
    body.trapstar-order-pay-page #payment,
    body.trapstar-order-pay-page .woocommerce-checkout-payment {
        order: -1 !important;
    }
    /* Color sahi – button clear dikhe */
    body.trapstar-order-pay-page #place_order,
    body.trapstar-order-pay-page .woocommerce button[type="submit"].button,
    body.trapstar-order-pay-page input#place_order {
        background: #000 !important;
        color: #fff !important;
        border-color: #000 !important;
    }
    body.trapstar-order-pay-page #place_order:hover,
    body.trapstar-order-pay-page .woocommerce button[type="submit"].button:hover,
    body.trapstar-order-pay-page input#place_order:hover {
        background: #333 !important;
        color: #fff !important;
        border-color: #333 !important;
    }
    ';
}
