﻿using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PersionalExpenses.Migrations
{
    /// <inheritdoc />
    public partial class AddCategoryIsDefault : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsDefault",
                table: "categories",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsDefault",
                table: "categories");
        }
    }
}
