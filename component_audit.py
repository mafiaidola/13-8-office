#!/usr/bin/env python3
"""
Component Registry Audit Script
فحص شامل لسجل المكونات للعثور على المكونات المفقودة
"""

import os
import json
from pathlib import Path

class ComponentRegistryAuditor:
    def __init__(self):
        self.frontend_src = Path("/app/frontend/src")
        self.components_dir = self.frontend_src / "components"
        self.config_file = self.frontend_src / "config" / "systemConfig.js"
        self.registry_file = self.frontend_src / "components" / "Core" / "ComponentRegistry.js"
        
    def extract_components_from_config(self):
        """Extract component names from systemConfig.js"""
        try:
            with open(self.config_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Find all component declarations
            import re
            pattern = r"component:\s*['\"]([^'\"]+)['\"]"
            matches = re.findall(pattern, content)
            return set(matches)
        except Exception as e:
            print(f"Error reading systemConfig.js: {e}")
            return set()
    
    def extract_components_from_registry(self):
        """Extract component names from ComponentRegistry.js"""
        try:
            with open(self.registry_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Find all component registrations
            import re
            pattern = r"(\w+):\s*createLazyComponent"
            matches = re.findall(pattern, content)
            return set(matches)
        except Exception as e:
            print(f"Error reading ComponentRegistry.js: {e}")
            return set()
    
    def check_component_files_exist(self):
        """Check which component files actually exist"""
        existing_components = {}
        
        for root, dirs, files in os.walk(self.components_dir):
            for file in files:
                if file.endswith('.js') and not file.startswith('.'):
                    file_path = Path(root) / file
                    component_name = file.stem
                    relative_path = file_path.relative_to(self.components_dir)
                    existing_components[component_name] = str(relative_path)
        
        return existing_components
    
    def audit_components(self):
        """Perform comprehensive audit"""
        print("🔍 فحص شامل لسجل المكونات...")
        print("=" * 60)
        
        # Extract component requirements
        config_components = self.extract_components_from_config()
        registry_components = self.extract_components_from_registry()
        existing_files = self.check_component_files_exist()
        
        print(f"📋 مكونات مطلوبة في systemConfig.js: {len(config_components)}")
        print(f"📦 مكونات مسجلة في ComponentRegistry.js: {len(registry_components)}")
        print(f"📁 ملفات مكونات موجودة: {len(existing_files)}")
        print()
        
        # Find missing registrations
        missing_registrations = config_components - registry_components
        if missing_registrations:
            print("❌ مكونات مفقودة من ComponentRegistry.js:")
            for component in sorted(missing_registrations):
                print(f"   - {component}")
                # Try to find the file
                if component in existing_files:
                    print(f"     📁 الملف موجود: {existing_files[component]}")
                else:
                    print(f"     📁 الملف مفقود أيضاً!")
            print()
        
        # Find unused registrations
        unused_registrations = registry_components - config_components
        if unused_registrations:
            print("⚠️  مكونات مسجلة لكن غير مستخدمة:")
            for component in sorted(unused_registrations):
                print(f"   - {component}")
            print()
        
        # Find missing component files
        required_files = config_components | registry_components
        missing_files = required_files - set(existing_files.keys())
        if missing_files:
            print("📁 ملفات مكونات مفقودة:")
            for component in sorted(missing_files):
                print(f"   - {component}.js")
            print()
        
        # Summary
        print("📊 ملخص الفحص:")
        print(f"   ✅ مكونات كاملة: {len(config_components & registry_components & set(existing_files.keys()))}")
        print(f"   ❌ مكونات مفقودة من Registry: {len(missing_registrations)}")
        print(f"   ⚠️  مكونات غير مستخدمة: {len(unused_registrations)}")
        print(f"   📁 ملفات مفقودة: {len(missing_files)}")
        
        return {
            "missing_registrations": list(missing_registrations),
            "unused_registrations": list(unused_registrations),
            "missing_files": list(missing_files),
            "existing_files": existing_files
        }

if __name__ == "__main__":
    auditor = ComponentRegistryAuditor()
    results = auditor.audit_components()