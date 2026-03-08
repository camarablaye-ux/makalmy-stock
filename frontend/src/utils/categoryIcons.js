export const getCategoryIcon = (category) => {
    if (!category) return '🏷️';
    const cat = category.toLowerCase();
    if (cat.includes('boisson')) return '🥤';
    if (cat.includes('viande') || cat.includes('poulet') || cat.includes('boeuf') || cat.includes('steak')) return '🥩';
    if (cat.includes('surgelé') || cat.includes('congelé') || cat.includes('glace')) return '🧊';
    if (cat.includes('légume') || cat.includes('salade') || cat.includes('tomate')) return '🥬';
    if (cat.includes('sauce') || cat.includes('condiment') || cat.includes('ketchup') || cat.includes('mayo')) return '🥫';
    if (cat.includes('emballage') || cat.includes('carton') || cat.includes('gobelet') || cat.includes('sachet')) return '📦';
    if (cat.includes('pain') || cat.includes('bun')) return '🍔';
    if (cat.includes('dessert') || cat.includes('sucré')) return '🍰';
    if (cat.includes('frite') || cat.includes('snack') || cat.includes('tapas')) return '🍟';
    if (cat.includes('nettoyage') || cat.includes('entretien') || cat.includes('hygiène')) return '🧹';
    if (cat.includes('frais') || cat.includes('laitier') || cat.includes('fromage')) return '🧀';
    return '🏷️';
};
