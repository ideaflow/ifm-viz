/**
 * Copyright 2015 New Iron Group, Inc.
 *
 * Licensed under the GNU GENERAL PUBLIC LICENSE, Version 3 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * 	http://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.openmastery.visualizer.ui;

import org.openmastery.visualizer.api.DemoInput;
import org.openmastery.visualizer.api.DemoResult;
import javax.ws.rs.Consumes;
import javax.ws.rs.core.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Controller
public class VisualizerController {

    @RequestMapping("/")
    public String home(Model model) {
       // model.addAttribute("demoInput", new DemoInput("Some Value"));
        return "home";
    }

    @Consumes(MediaType.APPLICATION_JSON)
    @RequestMapping(value="/submitDemo", method=RequestMethod.POST)
    public String demoSubmit(@ModelAttribute("demoInput") DemoInput demoInput, Model model) {
//        DemoResult result = new DemoResult(demoInput.getInputValue() + " Result");
//        model.addAttribute("demoResult", result);
        return "result";
    }

}
