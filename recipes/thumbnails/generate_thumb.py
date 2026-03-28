from PIL import Image, ImageDraw, ImageFont
import os

W, H = 800, 800
bg_color = "#FFF8F0"
accent = "#E8832A"
dark = "#2D2D2D"
light_text = "#8C7B6B"

img = Image.new("RGB", (W, H), bg_color)
draw = ImageDraw.Draw(img)

font_path = "/System/Library/Fonts/AppleSDGothicNeo.ttc"

try:
    font_title = ImageFont.truetype(font_path, 62, index=5)  # Bold
    font_sub = ImageFont.truetype(font_path, 30, index=0)
    font_icon = ImageFont.truetype(font_path, 120, index=0)
    font_tag = ImageFont.truetype(font_path, 24, index=3)
except:
    font_title = ImageFont.truetype(font_path, 62)
    font_sub = ImageFont.truetype(font_path, 30)
    font_icon = ImageFont.truetype(font_path, 120)
    font_tag = ImageFont.truetype(font_path, 24)

# Background circle decoration
draw.ellipse([W-250, -100, W+50, 200], fill="#FFF0E0")
draw.ellipse([-80, H-200, 150, H+30], fill="#FFF0E0")

# Top tag
tag_text = "EASY RECIPE"
tag_bbox = draw.textbbox((0, 0), tag_text, font=font_tag)
tag_w = tag_bbox[2] - tag_bbox[0]
draw.rounded_rectangle([W//2 - tag_w//2 - 20, 60, W//2 + tag_w//2 + 20, 100], radius=15, fill=accent)
draw.text((W//2, 80), tag_text, fill="white", font=font_tag, anchor="mm")

# Pasta illustration (plate circle + fork lines)
cx, cy = W//2, 260
# Plate
draw.ellipse([cx-90, cy-90, cx+90, cy+90], fill="white", outline="#E0D5C8", width=3)
# Inner plate ring
draw.ellipse([cx-70, cy-70, cx+70, cy+70], outline="#EDE5DA", width=2)
# Pasta swirl lines (simplified noodle look)
for offset in [-20, 0, 20]:
    draw.arc([cx-40+offset, cy-35, cx+20+offset, cy+35], start=30, end=330, fill=accent, width=3)
# Steam lines
for sx in [cx-25, cx, cx+25]:
    draw.arc([sx-8, cy-120, sx+8, cy-90], start=180, end=360, fill="#D4C4B0", width=2)
    draw.arc([sx-8, cy-140, sx+8, cy-115], start=0, end=180, fill="#D4C4B0", width=2)

# Decorative line
line_y = 390
draw.line([(W//2 - 80, line_y), (W//2 + 80, line_y)], fill=accent, width=3)

# Title
draw.text((W//2, 460), "마늘 버터", fill=dark, font=font_title, anchor="mm")
draw.text((W//2, 540), "파스타", fill=dark, font=font_title, anchor="mm")

# Subtitle
draw.text((W//2, 620), "13분 완성  ·  1인분  ·  초간단", fill=light_text, font=font_sub, anchor="mm")

# Bottom ingredients
ingredients = ["버터", "마늘", "스파게티", "올리브유"]
total_w = len(ingredients) * 120
start_x = W//2 - total_w//2 + 60
for i, ing in enumerate(ingredients):
    x = start_x + i * 120
    y = 720
    draw.rounded_rectangle([x-45, y-20, x+45, y+20], radius=12, fill="#FFF0E0", outline=accent, width=1)
    draw.text((x, y), ing, fill=accent, font=font_tag, anchor="mm")

out_path = os.path.join(os.path.dirname(__file__), "garlic-butter-pasta.png")
img.save(out_path, "PNG", quality=95)
print(f"Saved: {out_path}")
