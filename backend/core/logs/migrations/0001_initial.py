# Generated by Django 5.1.6 on 2025-03-21 02:16

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('home', '0008_hospitaldocumentacess_patinetdocumentacess_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='hospitallogs',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('ipofAccess', models.CharField(max_length=100)),
                ('time', models.DateTimeField(auto_now_add=True)),
                ('hash', models.CharField(blank=True, max_length=100, null=True)),
                ('document_no', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='home.hospitaldocument')),
            ],
        ),
        migrations.CreateModel(
            name='patientlogs',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('ipofAccess', models.CharField(max_length=100)),
                ('time', models.DateTimeField(auto_now_add=True)),
                ('hash', models.CharField(blank=True, max_length=100, null=True)),
                ('document_no', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='home.patientdocument')),
            ],
        ),
    ]
