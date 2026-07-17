import 'package:flutter/material.dart';
import '../../app/theme/colors.dart';

class AppTable<T> extends StatelessWidget {
  final List<String> columns;
  final List<T> rows;
  final List<Widget> Function(T row) cellBuilder;
  final String emptyMessage;

  const AppTable({
    super.key,
    required this.columns,
    required this.rows,
    required this.cellBuilder,
    this.emptyMessage = 'No data available.',
  });

  @override
  Widget build(BuildContext context) {
    if (rows.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Text(emptyMessage, style: const TextStyle(color: AppColors.textSecondary)),
        ),
      );
    }

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: DataTable(
        headingRowColor: WidgetStateProperty.all(AppColors.surface),
        columns: columns
            .map((col) => DataColumn(
                  label: Text(col,
                      style: const TextStyle(
                          color: AppColors.primary, fontWeight: FontWeight.bold)),
                ))
            .toList(),
        rows: rows
            .map((row) => DataRow(
                  cells: cellBuilder(row)
                      .map((cell) => DataCell(cell))
                      .toList(),
                ))
            .toList(),
      ),
    );
  }
}
