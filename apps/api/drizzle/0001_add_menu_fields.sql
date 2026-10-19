ALTER TABLE "categories" ADD COLUMN "category_image" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "product_image" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "product_price" numeric DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "product_discount" numeric DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_category_image_unique" UNIQUE("category_image");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_product_image_unique" UNIQUE("product_image");