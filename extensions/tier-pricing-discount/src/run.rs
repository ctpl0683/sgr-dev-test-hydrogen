use crate::schema;
use crate::schema::run::input::cart::lines::Merchandise;
use shopify_function::prelude::*;
use shopify_function::Result;
use std::collections::HashMap;

/// Supported cities for tier pricing
const SUPPORTED_CITIES: &[&str] = &["bangalore", "chennai", "hyderabad", "mumbai", "delhi"];

/// Tier rules: (min_quantity, discount_percent)
/// These are hardcoded but can be made configurable via admin UI
const TIER_RULES: &[(i32, f64)] = &[
    (2, 5.0),   // 2+ items = 5% off
    (5, 10.0),  // 5+ items = 10% off
    (10, 15.0), // 10+ items = 15% off
];

#[shopify_function]
fn run(input: schema::run::Input) -> Result<schema::FunctionRunResult> {
    let _no_discount = schema::FunctionRunResult {
        discounts: vec![],
        discount_application_strategy: schema::DiscountApplicationStrategy::First,
    };

    // Group cart lines by city (extracted from variant title)
    let mut city_quantities: HashMap<String, (i32, Vec<String>)> = HashMap::new();

    for line in input.cart().lines() {
        // Get the merchandise - use pattern matching for union type
        let merchandise = line.merchandise();
        
        // Check if it's a ProductVariant using the generated enum
        if let Merchandise::ProductVariant(variant) = merchandise {
            // Extract city from variant title
            // Variant title format: "City" or "City / Size" etc.
            if let Some(variant_title) = variant.title() {
                if let Some(city_name) = extract_city_from_title(variant_title) {
                    let entry = city_quantities.entry(city_name).or_insert((0, vec![]));
                    entry.0 += *line.quantity();
                    entry.1.push(line.id().to_string());
                }
            }
        }
    }

    // Build discounts for each city group
    let mut discounts = vec![];

    for (city, (total_qty, line_ids)) in city_quantities.iter() {
        // Find applicable tier (highest min_qty that's <= total_qty)
        if let Some((_, discount_percent)) = TIER_RULES.iter()
            .filter(|(min_qty, _)| *min_qty <= *total_qty)
            .max_by_key(|(min_qty, _)| min_qty)
        {
            if *discount_percent > 0.0 {
                let targets: Vec<schema::Target> = line_ids.iter()
                    .map(|id| schema::Target::CartLine(schema::CartLineTarget {
                        id: id.clone(),
                        quantity: None,
                    }))
                    .collect();

                discounts.push(schema::Discount {
                    targets,
                    value: schema::Value::Percentage(schema::Percentage {
                        value: Decimal(*discount_percent),
                    }),
                    message: Some(format!(
                        "{} bulk: {}% off ({} items)",
                        capitalize(&city),
                        discount_percent,
                        total_qty
                    )),
                });
            }
        }
    }

    Ok(schema::FunctionRunResult {
        discounts,
        discount_application_strategy: schema::DiscountApplicationStrategy::First,
    })
}

/// Extract city name from variant title
/// Handles formats like "Bangalore", "Bangalore / Large", "Default Title / bangalore"
fn extract_city_from_title(title: &str) -> Option<String> {
    // Split by " / " and check ALL parts for a city match
    for part in title.split(" / ") {
        let normalized = part.trim().to_lowercase();
        if SUPPORTED_CITIES.contains(&normalized.as_str()) {
            return Some(normalized);
        }
    }
    None
}

fn capitalize(s: &str) -> String {
    let mut chars = s.chars();
    match chars.next() {
        None => String::new(),
        Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),
    }
}
